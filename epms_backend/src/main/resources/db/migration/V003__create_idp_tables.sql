CREATE TABLE IF NOT EXISTS development_plans (
    idp_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    employee_id BIGINT NOT NULL,
    manager_id BIGINT NOT NULL,
    appraisal_id BIGINT NULL,
    title VARCHAR(255) NOT NULL,
    summary TEXT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_by BIGINT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    deleted_at DATETIME NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_idp_employee FOREIGN KEY (employee_id) REFERENCES employee(id),
    CONSTRAINT fk_idp_manager FOREIGN KEY (manager_id) REFERENCES employee(id),
    CONSTRAINT fk_idp_appraisal FOREIGN KEY (appraisal_id) REFERENCES appraisals(appraisal_id)
);

CREATE TABLE IF NOT EXISTS development_goals (
    goal_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    idp_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    category VARCHAR(50) NOT NULL,
    success_criteria TEXT NULL,
    target_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL,
    progress_percent INT DEFAULT 0,
    manager_comment TEXT NULL,
    employee_comment TEXT NULL,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    deleted_at DATETIME NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_goal_idp FOREIGN KEY (idp_id) REFERENCES development_plans(idp_id)
);

CREATE TABLE IF NOT EXISTS development_plan_follow_ups (
    idp_id BIGINT NOT NULL,
    follow_up_date DATE NOT NULL,
    CONSTRAINT fk_idp_follow_up_plan FOREIGN KEY (idp_id) REFERENCES development_plans(idp_id)
);

CREATE TABLE IF NOT EXISTS development_progress_updates (
    update_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    goal_id BIGINT NOT NULL,
    progress_note TEXT NOT NULL,
    progress_percent INT NOT NULL,
    updated_by BIGINT NOT NULL,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    deleted_at DATETIME NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_progress_goal FOREIGN KEY (goal_id) REFERENCES development_goals(goal_id),
    CONSTRAINT fk_progress_updated_by FOREIGN KEY (updated_by) REFERENCES employee(id)
);
