package ace.org.epms_backend.model;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

@Entity
@Table(name = "kpi_progress")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
public class KpiProgress extends BaseEntity{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "goal_item_id")
    private KpiGoalItem goalItem;

    private BigDecimal actualValue;

    private BigDecimal progressPercent;

    @Column(columnDefinition = "TEXT")
    private String evidenceNote;

    private Long updatedBy;
}
