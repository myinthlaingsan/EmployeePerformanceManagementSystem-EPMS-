package ace.org.epms_backend.model.kpi;

import ace.org.epms_backend.model.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "kpi_history_log")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
public class KpiHistoryLog extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long employeeId;

    private Long goalSetId;
    private Long itemId;

    // Legacy version-based fields (kept for backward compatibility with old
    // records)
    private Long oldVersionId;
    private Long newVersionId;

    private String action;

    @Column(columnDefinition = "TEXT")
    private String changeReason;

    @Column(columnDefinition = "TEXT")
    private String changeDetails;

    private Long changedBy;
}
