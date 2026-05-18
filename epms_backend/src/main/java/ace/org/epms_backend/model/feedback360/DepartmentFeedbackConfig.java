package ace.org.epms_backend.model.feedback360;

import ace.org.epms_backend.model.BaseEntity;
import ace.org.epms_backend.model.appraisal.AppraisalFormSet;
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
@Table(name = "dept_feedback_config")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class DepartmentFeedbackConfig extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_level_id")
    private JobLevel jobLevel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "form_set_id")
    private AppraisalFormSet formSet;

    private Integer minPeers;
    private Integer maxPeers;
    private Integer minSubordinates;
    private Integer maxSubordinates;

    @Builder.Default
    private Boolean allowCrossDepartment = false;

    @Builder.Default
    private Boolean isDefault = false;

    @Builder.Default
    private Boolean isActive = true;
}
