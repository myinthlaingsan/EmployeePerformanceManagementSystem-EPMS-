package ace.org.epms_backend.model;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "kpi_history_log")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class KpiHistoryLog extends BaseEntity{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long employeeId;

    private Long oldVersionId;
    private Long newVersionId;

    private String action;

    @Column(columnDefinition = "TEXT")
    private String changeReason;

    private Long changedBy;
}
