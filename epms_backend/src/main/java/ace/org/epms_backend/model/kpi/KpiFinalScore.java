package ace.org.epms_backend.model.kpi;
<<<<<<< HEAD
import ace.org.epms_backend.model.BaseEntity;
=======
import ace.org.epms_backend.model.appraisal.Appraisal;
>>>>>>> origin/main
import ace.org.epms_backend.model.employee.Employee;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "kpi_final_scores")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class KpiFinalScore extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "appraisal_id") // Direct link to your Appraisal table
    private Appraisal appraisal;

    @ManyToOne
    @JoinColumn(name = "employee_id")
    private Employee employee;

    @ManyToOne
    @JoinColumn(name = "goal_set_id")
    private KpiGoals goalSet;

    private BigDecimal totalAchievementPercent;

    private BigDecimal weightedScore;

    private Instant calculatedAt;

    private Long finalizedBy;
}
