package ace.org.epms_backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "manager_evaluation")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ManagerEvaluation extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long evaluationId;

    @OneToOne
    @JoinColumn(name = "appraisal_id")
    private Appraisal appraisal;

    private Instant submittedAt;
}
