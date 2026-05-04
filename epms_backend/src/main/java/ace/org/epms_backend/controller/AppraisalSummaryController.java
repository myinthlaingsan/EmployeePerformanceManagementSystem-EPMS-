package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.appraisal.AppraisalSummaryResponse;
import ace.org.epms_backend.service.AppraisalSummaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/appraisal-summaries")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
public class AppraisalSummaryController {

    private final AppraisalSummaryService summaryService;

    @GetMapping("/{cycleId}")
    public ResponseEntity<ApiResponse<List<AppraisalSummaryResponse>>> getByCycleId(
            @PathVariable Long cycleId
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                summaryService.getByCycleId(cycleId)
        ));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<ApiResponse<List<AppraisalSummaryResponse>>> getByEmployeeId(
            @PathVariable Long employeeId
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                summaryService.getByEmployeeId(employeeId)
        ));
    }
}
