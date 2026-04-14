package ace.org.epms_backend.model;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "kpi_goal_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class KpiGoalItem extends BaseEntity{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "goal_set_id")
    private KpiGoals goalSet;

    private String title;

    private BigDecimal targetValue;

    private String unit;

    private BigDecimal weightPercent;

    @Enumerated(EnumType.STRING)
    private KpiItemStatus status;

    private Boolean isActive = true;
}
