package ace.org.epms_backend.service.feedback360;

import ace.org.epms_backend.dto.feedback360.FeedbackSummaryResponse;
import java.util.List;

public interface FeedbackSummaryService {
    void generateSummary(Long employeeId, Long cycleId);
    void generateAllSummaries(Long cycleId);
    FeedbackSummaryResponse getSummary(Long employeeId, Long cycleId);
    List<FeedbackSummaryResponse> getSummariesByCycle(Long cycleId);
    void finalizeSummary(Long summaryId);
    List<FeedbackSummaryResponse> getFinalizedSummariesForEmployee(Long employeeId);
}
