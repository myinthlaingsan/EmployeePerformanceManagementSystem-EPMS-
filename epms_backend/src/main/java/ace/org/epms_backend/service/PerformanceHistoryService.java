package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.continuous.PerformanceHistoryResponse;
import ace.org.epms_backend.enums.SourceType;

import java.util.List;

public interface PerformanceHistoryService {
    List<PerformanceHistoryResponse> getHistoryByEmployee(Long employeeId);
    List<PerformanceHistoryResponse> getHistoryBySource(SourceType sourceType, Long sourceId);
    PerformanceHistoryResponse getHistoryById(Long historyId);
    List<PerformanceHistoryResponse> getAllHistory();
}
