-- ============================================================
-- Seed all canonical permission names (Section 4 of the plan).
-- INSERT IGNORE / ON CONFLICT DO NOTHING keeps this idempotent.
-- ============================================================

INSERT INTO permission (permission_name) VALUES
  -- Employee Management
  ('EMPLOYEE_VIEW'),
  ('EMPLOYEE_CREATE'),
  ('EMPLOYEE_EDIT'),
  ('EMPLOYEE_DELETE'),
  ('EMPLOYEE_EXPORT'),
  -- Organisation Structure
  ('ORG_DEPT_MANAGE'),
  ('ORG_POSITION_MANAGE'),
  ('ORG_LEVEL_MANAGE'),
  ('ORG_TEAM_MANAGE'),
  -- Role & Permission (ADMIN only)
  ('ROLE_MANAGE'),
  ('PERMISSION_MANAGE'),
  -- KPI
  ('KPI_VIEW_OWN'),
  ('KPI_VIEW_TEAM'),
  ('KPI_VIEW_ALL'),
  ('KPI_CREATE'),
  ('KPI_APPROVE'),
  ('KPI_LIBRARY_MANAGE'),
  -- Appraisal
  ('APPRAISAL_VIEW_OWN'),
  ('APPRAISAL_SELF_ASSESS'),
  ('APPRAISAL_EVALUATE'),
  ('APPRAISAL_VIEW_TEAM'),
  ('APPRAISAL_VIEW_ALL'),
  ('APPRAISAL_CYCLE_MANAGE'),
  ('APPRAISAL_FORM_DESIGN'),
  ('APPRAISAL_CALIBRATE'),
  -- 360 Feedback
  ('FEEDBACK360_PARTICIPATE'),
  ('FEEDBACK360_NOMINATE'),
  ('FEEDBACK360_VIEW_REPORT'),
  ('FEEDBACK360_MANAGE'),
  -- PIP
  ('PIP_VIEW_OWN'),
  ('PIP_CREATE'),
  ('PIP_MANAGE'),
  -- Continuous Feedback & Meetings
  ('CONTINUOUS_FEEDBACK'),
  ('MEETING_MANAGE'),
  -- Reports & Analytics
  ('REPORT_VIEW_TEAM'),
  ('REPORT_VIEW_ALL'),
  ('REPORT_EXPORT'),
  -- Cycle Configuration
  ('CYCLE_CONFIG_MANAGE')
ON DUPLICATE KEY UPDATE permission_name = VALUES(permission_name);
