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
@Table(name = "manager_evaluations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ManagerEvaluation extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long evaluationId;

    @OneToOne
    @JoinColumn(name = "appraisal_id", nullable = false)
    private Appraisal appraisal;

    private BigDecimal totalScore;

    private Boolean submitted = false;

    private Instant lastSavedAt;

    @Column(columnDefinition = "TEXT")
    private String finalComment;

    private Instant submittedAt;
}
