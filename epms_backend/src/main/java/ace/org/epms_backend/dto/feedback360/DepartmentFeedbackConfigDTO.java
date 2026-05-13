package ace.org.epms_backend.dto.feedback360;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DepartmentFeedbackConfigDTO {
    private Long id;
    private Long departmentId;
    private String departmentName;
    private Long levelId;
    private String levelName;
    private Integer minPeers;
    private Integer maxPeers;
    private Integer minSubordinates;
    private Integer maxSubordinates;
    private Boolean allowCrossDepartment;
}
