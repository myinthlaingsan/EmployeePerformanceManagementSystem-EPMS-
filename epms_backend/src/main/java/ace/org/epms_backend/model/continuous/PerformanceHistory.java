package ace.org.epms_backend.model.continuous;
import ace.org.epms_backend.enums.SourceType;
import ace.org.epms_backend.model.BaseEntity;
import ace.org.epms_backend.model.employee.Employee;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "performance_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
public class PerformanceHistory extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long historyId;

    @ManyToOne
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Enumerated(EnumType.STRING)
    private SourceType sourceType;

    private Long sourceId;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private Boolean isPrivate = false;

    private Long createdBy;
}