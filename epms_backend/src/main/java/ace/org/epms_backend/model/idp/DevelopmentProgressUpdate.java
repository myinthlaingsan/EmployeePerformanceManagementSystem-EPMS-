package ace.org.epms_backend.model.idp;

import ace.org.epms_backend.model.BaseEntity;
import ace.org.epms_backend.model.employee.Employee;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "development_progress_updates")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true, exclude = {"goal", "updatedBy"})
@SuperBuilder
public class DevelopmentProgressUpdate extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long updateId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "goal_id", nullable = false)
    private DevelopmentGoal goal;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String progressNote;

    @Column(nullable = false)
    private Integer progressPercent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by", nullable = false)
    private Employee updatedBy;
}
