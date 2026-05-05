package ace.org.epms_backend.model.appraisal;

import ace.org.epms_backend.model.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "self_assessments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class SelfAssessment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long selfAssessmentId;

    @OneToOne
    @JoinColumn(name = "appraisal_id", nullable = false)
    private Appraisal appraisal;

    private BigDecimal totalScore;

    private Boolean submitted = false;

    private Instant lastSavedAt;

    private Instant submittedAt;
}
