package ace.org.epms_backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "feedback_response")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackResponse extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "feedback_id", nullable = false)
    private Feedback feedback;

    @ManyToOne
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    private Integer score;

    @Column(columnDefinition = "TEXT")
    private String comment;
}
