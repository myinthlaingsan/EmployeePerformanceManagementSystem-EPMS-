package ace.org.epms_backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "feedback_reply")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
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
}
