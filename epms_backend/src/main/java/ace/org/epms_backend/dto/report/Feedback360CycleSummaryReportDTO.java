package ace.org.epms_backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Feedback360CycleSummaryReportDTO {
    private Long cycleId;
    private String cycleName;
    private Long totalTargets;
    private Long totalRequests;
    private Long submittedRequests;
    private Double submissionRate;
    private List<Feedback360DepartmentScoreDTO> departmentScores;
}
