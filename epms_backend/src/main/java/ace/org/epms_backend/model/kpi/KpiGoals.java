package ace.org.epms_backend.model.kpi;
import java.time.Instant;

import ace.org.epms_backend.enums.KpiGoalStatus;
import ace.org.epms_backend.model.employee.Employee;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "kpi_goals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class KpiGoals {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Employee who owns goals
    @ManyToOne
    @JoinColumn(name = "employee_id")
    private Employee employee;

    // Manager who assigned
    @ManyToOne
    @JoinColumn(name = "manager_id")
    private Employee manager;

    private Long appraisalCycleId; // you can convert to entity later

    private Integer version;

    private Boolean isCurrent = true;

    @Enumerated(EnumType.STRING)
    private KpiGoalStatus status;

    private Long approvedBy;

    private Instant approvedAt;
}
