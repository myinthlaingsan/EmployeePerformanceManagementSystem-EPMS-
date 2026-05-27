-- ============================================================
-- Midcycle KPI Phase Split — Data Migration
-- ============================================================

CREATE TABLE IF NOT EXISTS kpi_goal_phases (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  employee_id BIGINT NOT NULL,
  cycle_id BIGINT NOT NULL,
  goal_set_id BIGINT,
  phase_number INT NOT NULL,
  phase_start_date DATE NOT NULL,
  phase_end_date DATE,
  phase_days INT,
  phase_weight DECIMAL(8,6),
  phase_score DECIMAL(10,4),
  change_reason VARCHAR(500),
  triggered_by BIGINT,
  status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (employee_id) REFERENCES employee(id),
  FOREIGN KEY (cycle_id) REFERENCES appraisal_cycles(cycle_id),
  FOREIGN KEY (goal_set_id) REFERENCES kpi_goals(id)
);

CREATE TABLE IF NOT EXISTS kpi_midcycle_final_scores (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  employee_id BIGINT NOT NULL,
  cycle_id BIGINT NOT NULL,
  total_phases INT,
  composite_score DECIMAL(10,4),
  phase_breakdown TEXT,
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  calculated_by BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (employee_id) REFERENCES employee(id),
  FOREIGN KEY (cycle_id) REFERENCES appraisal_cycles(cycle_id)
);
