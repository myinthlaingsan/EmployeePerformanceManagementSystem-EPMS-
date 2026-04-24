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
    public ResponseEntity<ApiResponse<KpiLibraryResponse>> createLibrary(
            @Valid @RequestBody KpiLibraryRequest request) {
        return ResponseEntity.ok(ApiResponse.success(kpiService.createLibrary(request)));
    }

    @GetMapping("/library")
    public ResponseEntity<ApiResponse<List<KpiLibraryResponse>>> getAllLibraries() {
        return ResponseEntity.ok(ApiResponse.success(kpiService.getAllActiveLibraries()));
    }

    @PatchMapping("/library/{id}/status")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public ResponseEntity<ApiResponse<KpiLibraryResponse>> toggleLibraryStatus(@PathVariable Long id, @RequestParam boolean active) {
        return ResponseEntity.ok(ApiResponse.success(kpiService.toggleLibraryStatus(id, active)));
    }

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<KpiCategoryResponse>>> getAllCategories() {
        return ResponseEntity.ok(ApiResponse.success(kpiService.getAllCategories()));
    }

    // 2. KPI Assignment (Manager/HR/Admin)
    @PostMapping("/assign")
    @PreAuthorize("hasAnyRole('MANAGER', 'HR', 'ADMIN')")
    public ResponseEntity<ApiResponse<GoalSetResponse>> assignKpi(@Valid @RequestBody GoalAssignmentRequest request) {
        return ResponseEntity.ok(ApiResponse.success(kpiService.assignKpiToEmployee(request)));
    }

    // 3. Goal Item Management (Manager - Pre-Approval)
    @PostMapping("/goal-set/{goalSetId}/items")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<GoalSetResponse>> addGoalItem(@PathVariable Long goalSetId, @Valid @RequestBody KpiGoalItemRequest request) {
        return ResponseEntity.ok(ApiResponse.success(kpiService.addGoalItem(goalSetId, request)));
    }

    @PutMapping("/items/{itemId}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<GoalSetResponse>> updateGoalItem(@PathVariable Long itemId, @Valid @RequestBody KpiGoalItemRequest request) {
        return ResponseEntity.ok(ApiResponse.success(kpiService.updateGoalItem(itemId, request)));
    }

    @DeleteMapping("/items/{itemId}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<GoalSetResponse>> deleteGoalItem(@PathVariable Long itemId) {
        return ResponseEntity.ok(ApiResponse.success(kpiService.deleteGoalItem(itemId)));
    }

    // 4. Goal Approval
    @PostMapping("/approve/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<GoalSetResponse>> approveGoals(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(kpiService.approveGoalSet(id)));
    }

    // 4. KPI Progress (Employee)
    @PostMapping("/progress")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<ApiResponse<GoalSetResponse>> updateProgress(@Valid @RequestBody ProgressRequest request) {
        return ResponseEntity.ok(ApiResponse.success(kpiService.updateProgress(request)));
    }

    // 5. KPI Revision (Manager)
    @PutMapping("/revise/{itemId}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<GoalSetResponse>> reviseKpi(@PathVariable Long itemId,
            @Valid @RequestBody KpiRevisionRequest request) {
        return ResponseEntity.ok(ApiResponse.success(kpiService.reviseKpi(itemId, request)));
    }

    // 6. KPI Score Calculation (System/Manager)
    @PostMapping("/calculate-score")
    @PreAuthorize("hasAnyRole('MANAGER', 'HR')")
    public ResponseEntity<ApiResponse<KpiScoreResponse>> calculateScore(@RequestParam Long employeeId, @RequestParam Long cycleId) {
        return ResponseEntity.ok(ApiResponse.success(kpiService.calculateFinalScore(employeeId, cycleId)));
    }
}
