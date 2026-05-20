package ace.org.epms_backend.model.feedback360;

import ace.org.epms_backend.model.BaseEntity;
import ace.org.epms_backend.model.appraisal.AppraisalCycle;
import ace.org.epms_backend.model.employee.JobLevel;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

@Entity
@Table(
    name = "scoring_policy",
    uniqueConstraints = @UniqueConstraint(columnNames = {"cycle_id", "job_level_id"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
public class ScoringPolicy extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cycle_id", nullable = false)
    private AppraisalCycle cycle;

    // Nullable → this row is the cycle-wide default
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_level_id")
    private JobLevel jobLevel;

    private BigDecimal managerWeight;      // e.g. 0.50
    private BigDecimal peerWeight;         // e.g. 0.30
    private BigDecimal subordinateWeight;  // e.g. 0.20
    private BigDecimal selfWeight;         // e.g. 0.00

    private Boolean includeSelfInFinal;

    private Integer suppressionThreshold;  // minimum group size before comments are shown
}
