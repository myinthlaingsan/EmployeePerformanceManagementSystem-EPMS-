package ace.org.epms_backend.model.appraisal;

import ace.org.epms_backend.model.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "self_assessment_answers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class SelfAssessmentAnswer extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "self_assessment_id", nullable = false)
    private SelfAssessment selfAssessment;

    @ManyToOne
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    private Integer ratingValue;
    private Boolean isCompleted;

    @Column(columnDefinition = "TEXT")
    private String comment;
}
