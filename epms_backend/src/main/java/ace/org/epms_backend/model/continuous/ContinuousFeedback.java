package ace.org.epms_backend.model.continuous;

import ace.org.epms_backend.enums.ContinuousStatus;
import ace.org.epms_backend.enums.FeedbackType;
import ace.org.epms_backend.model.BaseEntity;
import ace.org.epms_backend.model.employee.Employee;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import java.time.LocalDateTime;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "continuous_feedback")
@SQLDelete(sql = "UPDATE continuous_feedback SET is_deleted = true, deleted_at = NOW() WHERE feedback_id = ?")
@SQLRestriction("is_deleted = false OR is_deleted IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
public class ContinuousFeedback extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long feedbackId;

    @ManyToOne
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne
    @JoinColumn(name = "manager_id", nullable = false)
    private Employee manager;

    @Enumerated(EnumType.STRING)
    private FeedbackType feedbackType;

    @ManyToOne
    @JoinColumn(name = "tag_id")
    private FeedbackTag tag;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ContinuousStatus status = ContinuousStatus.PUBLISHED;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @org.hibernate.annotations.Formula("(SELECT COUNT(*) FROM feedback_reply r WHERE r.feedback_id = feedback_id AND (r.is_deleted = false OR r.is_deleted IS NULL))")
    private Integer replyCount;

    private Long createdBy;
}
