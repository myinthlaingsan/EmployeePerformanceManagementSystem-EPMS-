package ace.org.epms_backend.model.kpi;
import ace.org.epms_backend.model.employee.Employee;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "kpi_final_scores")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class KpiFinalScore {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long appraisalId; // FK (convert later if needed)

    @ManyToOne
    @JoinColumn(name = "employee_id")
    private Employee employee;

    private Long cycleId;

    @ManyToOne
    @JoinColumn(name = "goal_set_id")
    private KpiGoals goalSet;

    private BigDecimal totalAchievementPercent;

    private BigDecimal weightedScore;

    private Instant calculatedAt;

    private Long finalizedBy;
}
