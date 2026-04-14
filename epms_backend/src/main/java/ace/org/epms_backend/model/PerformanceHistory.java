package ace.org.epms_backend.model;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "performance_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
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

    private Long createdBy;
}