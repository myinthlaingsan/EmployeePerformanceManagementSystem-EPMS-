package ace.org.epms_backend.model;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "manager_evaluation_answer")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ManagerEvaluationAnswer extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "evaluation_id")
    private ManagerEvaluation evaluation;

    @ManyToOne
    @JoinColumn(name = "question_id")
    private Question question;

    private Integer ratingValue;

    @Column(columnDefinition = "TEXT")
    private String comment;
}
