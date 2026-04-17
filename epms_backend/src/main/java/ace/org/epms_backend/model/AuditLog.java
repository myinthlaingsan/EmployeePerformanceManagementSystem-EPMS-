package ace.org.epms_backend.model;

import ace.org.epms_backend.enums.AuditAction;
import ace.org.epms_backend.enums.AuditStatus;
import ace.org.epms_backend.model.employee.Employee;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.Instant;

@Entity
@Table(
        name = "audit_log",
        indexes = {
                @Index(name = "idx_table_record", columnList = "table_name, record_id"),
                @Index(name = "idx_changed_by", columnList = "changed_by"),
                @Index(name = "idx_changed_at", columnList = "changed_at")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
public class AuditLog extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long auditId;

    private String tableName;

    private Long recordId;

    @Enumerated(EnumType.STRING)
    private AuditAction action;

    @Column(columnDefinition = "JSON")
    private String oldValues;

    @Column(columnDefinition = "JSON")
    private String newValues;

    @ManyToOne
    @JoinColumn(name = "changed_by")
    private Employee changedBy;

    private Instant changedAt;

    private String ipAddress;

    @Column(columnDefinition = "TEXT")
    private String userAgent;

    @Enumerated(EnumType.STRING)
    private AuditStatus status;
}
