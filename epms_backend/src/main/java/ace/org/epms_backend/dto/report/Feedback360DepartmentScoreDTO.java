package ace.org.epms_backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Feedback360DepartmentScoreDTO {
    private String departmentName;
    private Long targetCount;
    private Double averageScore;
}
