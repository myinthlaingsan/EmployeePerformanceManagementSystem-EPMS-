package ace.org.epms_backend.model;
import ace.org.epms_backend.enums.KpiItemStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

@Entity
@Table(name = "kpi_goal_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
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
