package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.PagedResponse;
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
    public ResponseEntity<ApiResponse<PagedResponse<PerformanceHistoryResponse>>> getHistoryByEmployee(
            @PathVariable Long employeeId,
            @RequestParam(required = false) SourceType sourceType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PagedResponse<PerformanceHistoryResponse> responses = historyService.getHistoryByEmployee(employeeId, sourceType, page, size);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/source/{sourceType}/{sourceId}")
    public ResponseEntity<ApiResponse<PagedResponse<PerformanceHistoryResponse>>> getHistoryBySource(
            @PathVariable SourceType sourceType,
            @PathVariable Long sourceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PagedResponse<PerformanceHistoryResponse> responses = historyService.getHistoryBySource(sourceType, sourceId, page, size);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/{historyId}")
    public ResponseEntity<ApiResponse<PerformanceHistoryResponse>> getHistoryById(
            @PathVariable Long historyId) {
        PerformanceHistoryResponse response = historyService.getHistoryById(historyId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<PagedResponse<PerformanceHistoryResponse>>> getAllHistory(
            @RequestParam(required = false) SourceType sourceType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PagedResponse<PerformanceHistoryResponse> responses = historyService.getAllHistory(sourceType, page, size);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/employee/{employeeId}/raw")
    public ResponseEntity<ApiResponse<List<PerformanceHistoryResponse>>> getHistoryByEmployeeRaw(
            @PathVariable Long employeeId) {
        List<PerformanceHistoryResponse> responses = historyService.getHistoryByEmployeeRaw(employeeId);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/all/raw")
    public ResponseEntity<ApiResponse<List<PerformanceHistoryResponse>>> getAllHistoryRaw() {
        List<PerformanceHistoryResponse> responses = historyService.getAllHistoryRaw();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }
}