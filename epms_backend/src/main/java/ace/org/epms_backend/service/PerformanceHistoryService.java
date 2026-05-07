package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.PagedResponse;
import ace.org.epms_backend.dto.continuous.PerformanceHistoryResponse;
import ace.org.epms_backend.enums.SourceType;

import java.util.List;

public interface PerformanceHistoryService {
    PagedResponse<PerformanceHistoryResponse> getHistoryByEmployee(Long employeeId, SourceType sourceType, int page, int size);
    PagedResponse<PerformanceHistoryResponse> getHistoryBySource(SourceType sourceType, Long sourceId, int page, int size);
    PerformanceHistoryResponse getHistoryById(Long historyId);
    PagedResponse<PerformanceHistoryResponse> getAllHistory(SourceType sourceType, int page, int size);
    List<PerformanceHistoryResponse> getHistoryByEmployeeRaw(Long employeeId);
    List<PerformanceHistoryResponse> getAllHistoryRaw();
}
