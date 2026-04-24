package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.appraisal.AppraisalHistoryResponse;
import ace.org.epms_backend.service.AppraisalHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/histories")
@RequiredArgsConstructor
public class AppraisalHistoryController {

    private final AppraisalHistoryService historyService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AppraisalHistoryResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(historyService.getAllHistories()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AppraisalHistoryResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(historyService.getHistoryById(id)));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<ApiResponse<List<AppraisalHistoryResponse>>> getByEmployee(@PathVariable Long employeeId) {
        return ResponseEntity.ok(ApiResponse.success(historyService.getHistoryByEmployee(employeeId)));
    }

    @GetMapping("/cycle/{cycleId}")
    public ResponseEntity<ApiResponse<List<AppraisalHistoryResponse>>> getByCycle(@PathVariable Long cycleId) {
        return ResponseEntity.ok(ApiResponse.success(historyService.getHistoryByCycle(cycleId)));
    }
}
