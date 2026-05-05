package ace.org.epms_backend.model.appraisal;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "scoring_weights")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScoringWeight {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "cycle_id", nullable = false, unique = true)
    private AppraisalCycle cycle;

    private BigDecimal kpiWeight;

    private BigDecimal managerWeight;

    private BigDecimal feedbackWeight;

    private BigDecimal selfWeight;
}
