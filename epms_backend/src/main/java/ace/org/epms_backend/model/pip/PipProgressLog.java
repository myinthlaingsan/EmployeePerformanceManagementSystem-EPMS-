package ace.org.epms_backend.model.pip;

import ace.org.epms_backend.model.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

@Entity
@Table(name = "pip_progress_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
public class PipProgressLog extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long logId;

    @ManyToOne
    @JoinColumn(name = "objective_id", nullable = false)
    private PipObjective objective;

    @Column(columnDefinition = "TEXT")
    private String progressNote;

    private BigDecimal progressPercent;

    private Long updatedBy;
}