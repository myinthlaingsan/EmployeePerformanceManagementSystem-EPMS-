package ace.org.epms_backend.model;
import jakarta.persistence.*;
import lombok.*;

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
