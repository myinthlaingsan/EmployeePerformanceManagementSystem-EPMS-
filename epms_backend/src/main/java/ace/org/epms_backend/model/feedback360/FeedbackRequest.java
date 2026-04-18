package ace.org.epms_backend.model.feedback360;
import ace.org.epms_backend.enums.FeedbackRelationship;
import ace.org.epms_backend.enums.FeedbackStatus;
import ace.org.epms_backend.model.BaseEntity;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.appraisal.AppraisalCycle;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(
        name = "feedback_request",
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"target_user_id", "evaluator_id", "cycle_id", "relationship"}
        )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
public class FeedbackRequest extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "target_user_id", nullable = false)
    private Employee targetUser;

    @ManyToOne
    @JoinColumn(name = "evaluator_id", nullable = false)
    private Employee evaluator;

    @ManyToOne
    @JoinColumn(name = "cycle_id", nullable = false)
    private AppraisalCycle cycle;

    @Enumerated(EnumType.STRING)
    private FeedbackRelationship relationship;

    private Boolean isAnonymous = true;

    @Enumerated(EnumType.STRING)
    private FeedbackStatus status = FeedbackStatus.PENDING;
}
