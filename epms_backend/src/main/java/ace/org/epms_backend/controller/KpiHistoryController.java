package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.kpi.GoalSetResponse;
import ace.org.epms_backend.model.kpi.KpiHistoryLog;
import ace.org.epms_backend.service.kpi.KpiHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/kpi-history")
@RequiredArgsConstructor
public class KpiHistoryController {

    private final KpiHistoryService historyService;

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<ApiResponse<List<GoalSetResponse>>> getEmployeeKpiHistory(@PathVariable Long employeeId) {
        return ResponseEntity.ok(ApiResponse.success(historyService.getEmployeeKpiHistory(employeeId)));
    }

    @GetMapping("/goal-set/{goalSetId}/audit")
    public ResponseEntity<ApiResponse<List<KpiHistoryLog>>> getGoalSetAuditTrail(@PathVariable Long goalSetId) {
        return ResponseEntity.ok(ApiResponse.success(historyService.getGoalSetAuditTrail(goalSetId)));
    }
}
