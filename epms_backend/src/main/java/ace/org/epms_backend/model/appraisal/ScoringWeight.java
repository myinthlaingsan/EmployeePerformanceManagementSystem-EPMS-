package ace.org.epms_backend.model.appraisal;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "scoring_weight")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScoringWeight {

    @Id
    private Long id = 1L;

    private BigDecimal managerWeight = BigDecimal.valueOf(0.5);
    private BigDecimal feedbackWeight = BigDecimal.valueOf(0.3);
    private BigDecimal selfWeight = BigDecimal.valueOf(0.2);
}
