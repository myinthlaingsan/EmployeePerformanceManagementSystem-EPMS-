package ace.org.epms_backend.model.feedback360;

import ace.org.epms_backend.model.BaseEntity;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.appraisal.AppraisalCycle;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

@Entity
@Table(name = "feedback_summary")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
public class FeedbackSummary extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "employee_id")
    private Employee employee;

    @ManyToOne
    @JoinColumn(name = "cycle_id")
    private AppraisalCycle cycle;

    private BigDecimal managerScore;
    private BigDecimal peerScore;
    private BigDecimal subordinateScore;
    private BigDecimal selfScore;

    private BigDecimal finalScore;

    private Integer totalEvaluators;

    private Boolean isFinalized;
}
