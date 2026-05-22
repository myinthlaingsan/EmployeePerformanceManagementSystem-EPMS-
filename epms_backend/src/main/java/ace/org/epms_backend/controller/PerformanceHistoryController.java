package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.PagedResponse;
import ace.org.epms_backend.dto.continuous.PerformanceHistoryResponse;
import ace.org.epms_backend.dto.continuous.MeetingPulseResponse;
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
            @RequestParam(required = false) Boolean onlyByManager,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PagedResponse<PerformanceHistoryResponse> responses = historyService.getHistoryByEmployee(employeeId, sourceType, onlyByManager, page, size);
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
            @RequestParam(required = false) Long departmentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PagedResponse<PerformanceHistoryResponse> responses = historyService.getAllHistory(sourceType, departmentId, page, size);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/employee/{employeeId}/raw")
    public ResponseEntity<ApiResponse<List<PerformanceHistoryResponse>>> getHistoryByEmployeeRaw(
            @PathVariable Long employeeId) {
        List<PerformanceHistoryResponse> responses = historyService.getHistoryByEmployeeRaw(employeeId);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/all/raw")
    public ResponseEntity<ApiResponse<List<PerformanceHistoryResponse>>> getAllHistoryRaw(
            @RequestParam(required = false) Long departmentId) {
        List<PerformanceHistoryResponse> responses = historyService.getAllHistoryRaw(departmentId);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/pulse")
    public ResponseEntity<ApiResponse<List<PerformanceHistoryResponse>>> getPerformancePulse(
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) Boolean onlyByManager) {
        List<PerformanceHistoryResponse> responses = historyService.getPerformancePulse(departmentId, employeeId, onlyByManager);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/meeting-pulse")
    public ResponseEntity<ApiResponse<MeetingPulseResponse>> getMeetingPulse(
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) Boolean onlyByManager) {
        MeetingPulseResponse response = historyService.getMeetingPulse(departmentId, employeeId, onlyByManager);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}