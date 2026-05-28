package ace.org.epms_backend.model.kpi;

import ace.org.epms_backend.model.BaseEntity;
import ace.org.epms_backend.model.appraisal.AppraisalCycle;
import ace.org.epms_backend.model.employee.Employee;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "kpi_midcycle_final_scores")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class KpiMidcycleFinalScore extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne
    @JoinColumn(name = "cycle_id", nullable = false)
    private AppraisalCycle cycle;

    private Integer totalPhases;

    @Column(precision = 10, scale = 4)
    private BigDecimal compositeScore;

    @Column(columnDefinition = "TEXT")
    private String phaseBreakdown;

    private Instant calculatedAt;
    private Long calculatedBy;
}
