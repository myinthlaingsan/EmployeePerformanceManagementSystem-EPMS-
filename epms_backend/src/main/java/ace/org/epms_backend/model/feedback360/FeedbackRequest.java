package ace.org.epms_backend.model.feedback360;
import ace.org.epms_backend.enums.FeedbackRelationship;
import ace.org.epms_backend.enums.FeedbackStatus;
import ace.org.epms_backend.model.BaseEntity;
import ace.org.epms_backend.model.appraisal.AppraisalForm;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.appraisal.AppraisalCycle;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.Instant;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "form_id")
    private AppraisalForm form;

    @Enumerated(EnumType.STRING)
    private FeedbackRelationship relationship;

    private Boolean isAnonymous;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    @Builder.Default
    private FeedbackStatus status = FeedbackStatus.PENDING;

    private Instant dueDate;
    private Instant startedAt;
    private Instant lastReminderSentAt;

    // Anonymity is derived from relationship; callers cannot override it.
    @PrePersist
    @PreUpdate
    private void deriveAnonymity() {
        this.isAnonymous = (relationship == FeedbackRelationship.PEER
                || relationship == FeedbackRelationship.SUBORDINATE);
    }
}
