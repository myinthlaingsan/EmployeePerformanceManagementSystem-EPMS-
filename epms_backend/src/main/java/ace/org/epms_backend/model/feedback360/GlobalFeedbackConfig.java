package ace.org.epms_backend.model.feedback360;

import ace.org.epms_backend.model.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "global_feedback_config")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class GlobalFeedbackConfig extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Default limits for all departments/levels if not specified
    private Integer defaultMaxPeers = 3;
    private Integer defaultMaxSubordinates = 3;
    
    // Global workload limit for evaluators
    private Integer globalWorkloadLimit = 7;
    
    private Boolean isActive = true;
}
