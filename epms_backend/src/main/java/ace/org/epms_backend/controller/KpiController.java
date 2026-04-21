package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.kpi.*;
import ace.org.epms_backend.service.KpiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/kpi")
@RequiredArgsConstructor
public class KpiController {

    private final KpiService kpiService;

    // 1. KPI Library Management (HR/Admin)
    @PostMapping("/library")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public ResponseEntity<ApiResponse<KpiLibraryResponse>> createLibrary(@Valid @RequestBody KpiLibraryRequest request) {
        return ResponseEntity.ok(ApiResponse.success(kpiService.createLibrary(request)));
    }

    @GetMapping("/library")
    public ResponseEntity<ApiResponse<List<KpiLibraryResponse>>> getAllLibraries() {
        return ResponseEntity.ok(ApiResponse.success(kpiService.getAllActiveLibraries()));
    }

    @PatchMapping("/library/{id}/status")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> toggleLibraryStatus(@PathVariable Long id, @RequestParam boolean active) {
        kpiService.toggleLibraryStatus(id, active);
        return ResponseEntity.ok(ApiResponse.success());
    }

    // 2. KPI Assignment (Manager)
    @PostMapping("/assign")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<GoalSetResponse>> assignKpi(@Valid @RequestBody GoalAssignmentRequest request) {
        return ResponseEntity.ok(ApiResponse.success(kpiService.assignKpiToEmployee(request)));
    }

    // 3. Goal Approval
    @PostMapping("/approve/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<Void>> approveGoals(@PathVariable Long id) {
        kpiService.approveGoalSet(id);
        return ResponseEntity.ok(ApiResponse.success());
    }

    // 4. KPI Progress (Employee)
    @PostMapping("/progress")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<ApiResponse<Void>> updateProgress(@Valid @RequestBody ProgressRequest request) {
        kpiService.updateProgress(request);
        return ResponseEntity.ok(ApiResponse.success());
    }

    // 5. KPI Revision (Manager)
    @PutMapping("/revise/{itemId}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<Void>> reviseKpi(@PathVariable Long itemId, @Valid @RequestBody KpiRevisionRequest request) {
        kpiService.reviseKpi(itemId, request);
        return ResponseEntity.ok(ApiResponse.success());
    }

    // 6. KPI Score Calculation (System/Manager)
    @PostMapping("/calculate-score")
    @PreAuthorize("hasAnyRole('MANAGER', 'HR')")
    public ResponseEntity<ApiResponse<Void>> calculateScore(@RequestParam Long employeeId, @RequestParam Long cycleId) {
        kpiService.calculateFinalScore(employeeId, cycleId);
        return ResponseEntity.ok(ApiResponse.success());
    }
}
