package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.appraisal.AppraisalHistoryResponse;
import java.util.List;

public interface AppraisalHistoryService {
    List<AppraisalHistoryResponse> getAllHistories();
    AppraisalHistoryResponse getHistoryById(Long id);
    List<AppraisalHistoryResponse> getHistoryByEmployee(Long employeeId);
    List<AppraisalHistoryResponse> getHistoryByCycle(Long cycleId);
}
