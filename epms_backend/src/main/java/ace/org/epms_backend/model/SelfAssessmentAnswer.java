package ace.org.epms_backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "self_assessment_answer")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SelfAssessmentAnswer extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "self_assessment_id")
    private SelfAssessment selfAssessment;

    @ManyToOne
    @JoinColumn(name = "question_id")
    private Question question;

    private Boolean isCompleted;

    private String answerValue;

    @Column(columnDefinition = "TEXT")
    private String comment;
}
