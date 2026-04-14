package ace.org.epms_backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "self_assessment")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SelfAssessment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long selfAssessmentId;

    @OneToOne
    @JoinColumn(name = "appraisal_id")
    private Appraisal appraisal;

    private Instant submittedAt;
}
