package ace.org.epms_backend.model.kpi;
import ace.org.epms_backend.enums.KpiItemStatus;
import ace.org.epms_backend.model.BaseEntity;
import com.fasterxml.jackson.annotation.JsonIgnore;
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
public class KpiGoalItem extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "goal_set_id")
    @JsonIgnore
    private KpiGoals goalSet;
    @ManyToOne
    @JoinColumn(name = "category_id")
    private KpiCategory category;
    private String title;
    private String unit;
    private BigDecimal targetValue;
    private BigDecimal weightPercent;
    // Fields to store the math from your spreadsheet image
    private BigDecimal actualValue;    // The "Actual" column
    private BigDecimal scorePercent;   // The "Score (%)" column
    private BigDecimal weightedScore;  // The "Weighted Score" column
    @Enumerated(EnumType.STRING)
    private KpiItemStatus status;

    private Boolean isActive = true;
}
