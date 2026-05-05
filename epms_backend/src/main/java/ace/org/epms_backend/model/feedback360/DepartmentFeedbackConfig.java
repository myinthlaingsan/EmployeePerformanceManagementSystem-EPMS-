package ace.org.epms_backend.model.feedback360;

import ace.org.epms_backend.model.BaseEntity;
import ace.org.epms_backend.model.employee.Department;
import ace.org.epms_backend.model.employee.JobLevel;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

/**
 * Entity to store department and level-specific feedback generation settings.
 * If a department/level combination has an entry here, these settings override the global ones.
 */
@Entity
@Table(name = "dept_feedback_config", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"department_id", "job_level_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class DepartmentFeedbackConfig extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @ManyToOne
    @JoinColumn(name = "job_level_id", nullable = false)
    private JobLevel jobLevel;

    private Integer minPeers;
    private Integer maxPeers;
    private Integer minSubordinates;
    private Integer maxSubordinates;

    @Builder.Default
    private Boolean allowCrossDepartment = false;
}
