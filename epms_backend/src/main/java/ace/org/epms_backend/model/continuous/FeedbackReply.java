package ace.org.epms_backend.model.continuous;

import ace.org.epms_backend.model.BaseEntity;
import ace.org.epms_backend.model.employee.Employee;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "feedback_reply")
@SQLDelete(sql = "UPDATE feedback_reply SET is_deleted = true, deleted_at = NOW() WHERE reply_id = ?")
@SQLRestriction("is_deleted = false OR is_deleted IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
public class FeedbackReply extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long replyId;

    @ManyToOne
    @JoinColumn(name = "feedback_id", nullable = false)
    private ContinuousFeedback feedback;

    @ManyToOne
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(columnDefinition = "TEXT")
    private String replyText;

    @Column(name = "parent_id")
    private Long parentId;
}
