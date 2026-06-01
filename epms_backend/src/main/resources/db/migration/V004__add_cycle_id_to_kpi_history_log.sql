-- ============================================================
-- Midcycle KPI History Log Schema Update
-- ============================================================

ALTER TABLE kpi_history_log ADD COLUMN cycle_id BIGINT NULL;
