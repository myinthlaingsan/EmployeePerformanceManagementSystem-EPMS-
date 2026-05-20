-- ============================================================
-- 360 Feedback Module — Data Migration
-- Applies alongside Phase 1 and Phase 2 Java code changes.
-- Run once; re-running is safe (UPDATE WHERE ... is idempotent).
-- ============================================================

-- ─── 1. FeedbackRelationship: collapse MANAGER/SUPERIOR → DIRECT_MANAGER ─────

UPDATE feedback
SET relationship = 'DIRECT_MANAGER'
WHERE relationship IN ('MANAGER', 'SUPERIOR');

UPDATE feedback_request
SET relationship = 'DIRECT_MANAGER'
WHERE relationship IN ('MANAGER', 'SUPERIOR');

-- ─── 2. FeedbackStatus: SUBMITTED → COMPLETED ────────────────────────────────

UPDATE feedback_request
SET status = 'COMPLETED'
WHERE status = 'SUBMITTED';

-- ─── 3. New columns on feedback_request ──────────────────────────────────────

ALTER TABLE feedback_request
    ADD COLUMN IF NOT EXISTS due_date         TIMESTAMP,
    ADD COLUMN IF NOT EXISTS started_at       TIMESTAMP,
    ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMP;

-- Back-fill due_date from the cycle's end_date for existing PENDING/IN_PROGRESS requests
UPDATE feedback_request fr
    JOIN appraisal_cycles ac ON fr.cycle_id = ac.cycle_id
SET fr.due_date = ac.end_date
WHERE fr.due_date IS NULL
  AND fr.status IN ('PENDING', 'IN_PROGRESS');

-- ─── 4. New column on appraisal_form ─────────────────────────────────────────

ALTER TABLE appraisal_form
    ADD COLUMN IF NOT EXISTS target_relationship VARCHAR(30);

-- ─── 5. New columns on feedback_summary ──────────────────────────────────────

ALTER TABLE feedback_summary
    ADD COLUMN IF NOT EXISTS manager_summary        TEXT,
    ADD COLUMN IF NOT EXISTS calibrated_final_score DECIMAL(8,2),
    ADD COLUMN IF NOT EXISTS finalized_at           TIMESTAMP,
    ADD COLUMN IF NOT EXISTS finalized_by           BIGINT;

-- ─── 6. New table: competency ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS competency (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMP,
    updated_at  TIMESTAMP,
    deleted_at  TIMESTAMP,
    is_deleted  BOOLEAN DEFAULT FALSE
);

-- ─── 7. New table: scoring_policy ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS scoring_policy (
    id                   BIGINT AUTO_INCREMENT PRIMARY KEY,
    cycle_id             BIGINT NOT NULL,
    job_level_id         BIGINT,           -- NULL = cycle-wide default
    manager_weight       DECIMAL(5,2),
    peer_weight          DECIMAL(5,2),
    subordinate_weight   DECIMAL(5,2),
    self_weight          DECIMAL(5,2),
    include_self_in_final BOOLEAN DEFAULT FALSE,
    suppression_threshold INT DEFAULT 3,
    created_at           TIMESTAMP,
    updated_at           TIMESTAMP,
    deleted_at           TIMESTAMP,
    is_deleted           BOOLEAN DEFAULT FALSE,
    CONSTRAINT uq_scoring_policy UNIQUE (cycle_id, job_level_id),
    CONSTRAINT fk_sp_cycle      FOREIGN KEY (cycle_id)     REFERENCES appraisal_cycles(cycle_id),
    CONSTRAINT fk_sp_job_level  FOREIGN KEY (job_level_id) REFERENCES job_level(level_id)
);

-- ─── 8. Seed default ScoringPolicy rows for every existing active cycle ───────
-- Cycle-wide default: Manager 50%, Peer 30%, Subordinate 20%, Self 0%

INSERT INTO scoring_policy (cycle_id, job_level_id, manager_weight, peer_weight, subordinate_weight, self_weight, include_self_in_final, suppression_threshold, created_at, updated_at, is_deleted)
SELECT cycle_id, NULL, 0.50, 0.30, 0.20, 0.00, FALSE, 3, NOW(), NOW(), FALSE
FROM appraisal_cycles
WHERE is_active = TRUE
  AND NOT EXISTS (
      SELECT 1 FROM scoring_policy sp
      WHERE sp.cycle_id = appraisal_cycles.cycle_id
        AND sp.job_level_id IS NULL
  );
