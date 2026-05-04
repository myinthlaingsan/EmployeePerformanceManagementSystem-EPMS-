package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.continuous.PerformanceHistoryResponse;
import ace.org.epms_backend.enums.SourceType;
import ace.org.epms_backend.service.PerformanceHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/performance-history")
@RequiredArgsConstructor
public class PerformanceHistoryController {

    private final PerformanceHistoryService historyService;

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<ApiResponse<List<PerformanceHistoryResponse>>> getHistoryByEmployee(
            @PathVariable Long employeeId) {
        List<PerformanceHistoryResponse> responses = historyService.getHistoryByEmployee(employeeId);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/source/{sourceType}/{sourceId}")
    public ResponseEntity<ApiResponse<List<PerformanceHistoryResponse>>> getHistoryBySource(
            @PathVariable SourceType sourceType,
            @PathVariable Long sourceId) {
        List<PerformanceHistoryResponse> responses = historyService.getHistoryBySource(sourceType, sourceId);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/{historyId}")
    public ResponseEntity<ApiResponse<PerformanceHistoryResponse>> getHistoryById(
            @PathVariable Long historyId) {
        PerformanceHistoryResponse response = historyService.getHistoryById(historyId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<PerformanceHistoryResponse>>> getAllHistory() {
        List<PerformanceHistoryResponse> responses = historyService.getAllHistory();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }
}
