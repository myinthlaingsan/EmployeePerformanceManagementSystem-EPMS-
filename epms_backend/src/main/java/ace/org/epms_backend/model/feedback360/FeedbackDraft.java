package ace.org.epms_backend.model.feedback360;

import ace.org.epms_backend.model.BaseEntity;
import ace.org.epms_backend.model.employee.Employee;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(
    name = "feedback_draft",
    uniqueConstraints = @UniqueConstraint(columnNames = {"request_id", "evaluator_id"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
public class FeedbackDraft extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false)
    private FeedbackRequest request;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evaluator_id", nullable = false)
    private Employee evaluator;

    @Column(columnDefinition = "TEXT")
    private String overallComment;

    // JSON array of { questionId, rating, comment } objects
    @Column(columnDefinition = "TEXT")
    private String responsesJson;
}
