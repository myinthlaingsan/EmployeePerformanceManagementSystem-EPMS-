package ace.org.epms_backend.model.feedback360;

import ace.org.epms_backend.model.BaseEntity;
import ace.org.epms_backend.model.appraisal.Question;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "feedback_response")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
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

    private Integer score; // rating (1-5)

    @Column(columnDefinition = "TEXT")
    private String comment;
}
