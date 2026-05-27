package ace.org.epms_backend.model.kpi;

import ace.org.epms_backend.enums.PhaseStatus;
import ace.org.epms_backend.model.BaseEntity;
import ace.org.epms_backend.model.appraisal.AppraisalCycle;
import ace.org.epms_backend.model.employee.Employee;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "kpi_goal_phases")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class KpiGoalPhase extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne
    @JoinColumn(name = "cycle_id", nullable = false)
    private AppraisalCycle cycle;

    @ManyToOne
    @JoinColumn(name = "goal_set_id")
    private KpiGoals goalSet;

    @Column(nullable = false)
    private Integer phaseNumber;

    @Column(nullable = false)
    private LocalDate phaseStartDate;

    private LocalDate phaseEndDate;     // null = still open

    private Integer phaseDays;

    @Column(precision = 8, scale = 6)
    private BigDecimal phaseWeight;

    @Column(precision = 10, scale = 4)
    private BigDecimal phaseScore;

    @Column(length = 500)
    private String changeReason;

    private Long triggeredBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "VARCHAR(20) DEFAULT 'OPEN'")
    private PhaseStatus status;         // OPEN, LOCKED, SCORED
}
