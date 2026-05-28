package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.kpi.KpiAuditLogResponse;
import ace.org.epms_backend.dto.kpi.OrgKpiHistoryResponse;
import ace.org.epms_backend.service.kpi.KpiAuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/kpi-audit")
@RequiredArgsConstructor
public class KpiAuditLogController {

    private final KpiAuditLogService auditLogService;

    // HR: org-wide
    @GetMapping("/org")
    public ResponseEntity<ApiResponse<OrgKpiHistoryResponse>> getOrgHistory(
        @RequestParam Long cycleId,
        @RequestParam(required = false) String action,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(ApiResponse.success(
            auditLogService.getOrgWideHistory(cycleId, action, page, size)));
    }

    // Manager: team-scoped
    @GetMapping("/team")
    public ResponseEntity<ApiResponse<OrgKpiHistoryResponse>> getTeamHistory(
        @RequestParam Long cycleId,
        @RequestParam(required = false) String action,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(ApiResponse.success(
            auditLogService.getTeamHistory(cycleId, action, page, size)));
    }

    // HR + Manager + Employee: individual employee + cycle
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<ApiResponse<List<KpiAuditLogResponse>>> getIndividualHistory(
        @PathVariable Long employeeId,
        @RequestParam Long cycleId
    ) {
        return ResponseEntity.ok(ApiResponse.success(
            auditLogService.getIndividualHistory(employeeId, cycleId)));
    }
}
