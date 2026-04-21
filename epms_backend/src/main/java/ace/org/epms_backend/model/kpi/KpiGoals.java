package ace.org.epms_backend.model.kpi;

import ace.org.epms_backend.enums.KpiGoalStatus;
import ace.org.epms_backend.model.BaseEntity;
import ace.org.epms_backend.model.employee.Employee;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.Instant;

@Entity
@Table(name = "kpi_goals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class KpiGoals extends BaseEntity {
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

    @OneToMany(mappedBy = "goalSet", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private java.util.List<KpiGoalItem> items;

    private Long approvedBy;

    private Instant approvedAt;
}
