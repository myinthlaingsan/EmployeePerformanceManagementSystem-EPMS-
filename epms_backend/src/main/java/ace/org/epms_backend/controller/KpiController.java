package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.appraisal.AppraisalCycleResponse;
import ace.org.epms_backend.dto.kpi.*;
import ace.org.epms_backend.dto.PagedResponse;
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

    @GetMapping("/active-cycle")
    public ResponseEntity<ApiResponse<AppraisalCycleResponse>> getActiveCycle() {
        return ResponseEntity.ok(ApiResponse.success(kpiService.getActiveCycle()));
    }

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

//    @GetMapping("/categories")
//    public ResponseEntity<ApiResponse<List<KpiCategoryResponse>>> getAllCategories() {
//        return ResponseEntity.ok(ApiResponse.success(kpiService.getAllCategories()));
//    }

    // 2. KPI Assignment (Manager/HR/Admin)
    @PostMapping("/assign")
    @PreAuthorize("hasAnyRole('MANAGER', 'HR', 'ADMIN')")
    public ResponseEntity<ApiResponse<GoalSetResponse>> assignKpi(@Valid @RequestBody GoalAssignmentRequest request) {
        return ResponseEntity.ok(ApiResponse.success(kpiService.assignKpiToEmployee(request)));
    }

    @PostMapping("/bulk-assign")
    @PreAuthorize("hasAnyRole('MANAGER', 'HR', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> bulkAssignKpi(@Valid @RequestBody BulkGoalAssignmentRequest request) {
        kpiService.bulkAssignKpi(request);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // 3. Goal Item Management (Manager/HR/Admin - Pre-Approval)
    @PostMapping("/goal-set/{goalSetId}/items")
    @PreAuthorize("hasAnyRole('MANAGER', 'HR', 'ADMIN')")
    public ResponseEntity<ApiResponse<GoalSetResponse>> addGoalItem(@PathVariable Long goalSetId, @Valid @RequestBody KpiGoalItemRequest request) {
        return ResponseEntity.ok(ApiResponse.success(kpiService.addGoalItem(goalSetId, request)));
    }

    @PutMapping("/items/{itemId}")
    @PreAuthorize("hasAnyRole('MANAGER', 'HR', 'ADMIN')")
    public ResponseEntity<ApiResponse<GoalSetResponse>> updateGoalItem(@PathVariable Long itemId, @Valid @RequestBody KpiGoalItemRequest request) {
        return ResponseEntity.ok(ApiResponse.success(kpiService.updateGoalItem(itemId, request)));
    }

    @DeleteMapping("/items/{itemId}")
    @PreAuthorize("hasAnyRole('MANAGER', 'HR', 'ADMIN')")
    public ResponseEntity<ApiResponse<GoalSetResponse>> deleteGoalItem(@PathVariable Long itemId) {
        return ResponseEntity.ok(ApiResponse.success(kpiService.deleteGoalItem(itemId)));
    }

    // 4. Goal Approval
    @PostMapping("/approve/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'HR', 'ADMIN')")
    public ResponseEntity<ApiResponse<GoalSetResponse>> approveGoals(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(kpiService.approveGoalSet(id)));
    }

    // 4. KPI Progress (Employee & Manager)
    @PostMapping("/progress")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'HR', 'ADMIN')")
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

    // 7. Goal Set Retrieval
    @GetMapping("/goal-set/employee/{employeeId}")
    public ResponseEntity<ApiResponse<GoalSetResponse>> getGoalSetByEmployee(
            @PathVariable Long employeeId, @RequestParam Long cycleId) {
        return ResponseEntity.ok(ApiResponse.success(kpiService.getGoalSetByEmployee(employeeId, cycleId)));
    }

    @GetMapping("/goal-set/{id}")
    public ResponseEntity<ApiResponse<GoalSetResponse>> getGoalSetById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(kpiService.getGoalSetById(id)));
    }

    @PutMapping("/goal-set/{id}/bulk-items")
    @PreAuthorize("hasAnyRole('MANAGER', 'HR', 'ADMIN')")
    public ResponseEntity<ApiResponse<GoalSetResponse>> bulkUpdateItems(
            @PathVariable Long id, @RequestBody KpiGoalBulkUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success(kpiService.bulkUpdateGoalItems(id, request)));
    }

    @GetMapping("/progress/history")
    public ResponseEntity<ApiResponse<List<KpiProgressResponse>>> getRecentProgress(@RequestParam Long employeeId, @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(ApiResponse.success(kpiService.getRecentProgress(employeeId, limit)));
    }

    // --- New Endpoints based on KPI Module Expansion Plan ---

    @GetMapping("/library/{id}")
    public ResponseEntity<ApiResponse<KpiLibraryResponse>> getLibraryById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(kpiService.getLibraryById(id)));
    }

    @PutMapping("/library/{id}")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public ResponseEntity<ApiResponse<KpiLibraryResponse>> updateLibrary(
            @PathVariable Long id, @Valid @RequestBody KpiLibraryRequest request) {
        return ResponseEntity.ok(ApiResponse.success(kpiService.updateLibrary(id, request)));
    }

    @PostMapping("/library/{id}/clone")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public ResponseEntity<ApiResponse<KpiLibraryResponse>> cloneLibrary(
            @PathVariable Long id, @RequestParam String newTitle) {
        return ResponseEntity.ok(ApiResponse.success(kpiService.cloneLibrary(id, newTitle)));
    }

    @GetMapping("/library/search")
    public ResponseEntity<ApiResponse<PagedResponse<KpiLibraryResponse>>> searchLibraries(
            @RequestParam String keyword, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(kpiService.searchLibraries(keyword, page, size)));
    }

    @PostMapping("/goal-set/{id}/submit")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<ApiResponse<GoalSetResponse>> submitGoalSet(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(kpiService.submitGoalSet(id)));
    }

    @PostMapping("/goal-set/{id}/reject")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<GoalSetResponse>> rejectGoalSet(
            @PathVariable Long id, @RequestParam String reason) {
        return ResponseEntity.ok(ApiResponse.success(kpiService.rejectGoalSet(id, reason)));
    }

    @GetMapping("/goal-set/employee/all/{employeeId}")
    public ResponseEntity<ApiResponse<List<GoalSetResponse>>> getEmployeeGoalSets(@PathVariable Long employeeId) {
        return ResponseEntity.ok(ApiResponse.success(kpiService.getEmployeeGoalSets(employeeId)));
    }

    @GetMapping("/goal-set/team")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<List<GoalSetResponse>>> getTeamGoalSets(
            @RequestParam Long managerId, @RequestParam Long cycleId) {
        return ResponseEntity.ok(ApiResponse.success(kpiService.getTeamGoalSets(managerId, cycleId)));
    }

    @GetMapping("/goal-set/department")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<GoalSetResponse>>> getDepartmentGoalSets(
            @RequestParam Long departmentId, @RequestParam Long cycleId) {
        return ResponseEntity.ok(ApiResponse.success(kpiService.getDepartmentGoalSets(departmentId, cycleId)));
    }

    @PostMapping("/goal-set/{id}/revert")
    @PreAuthorize("hasAnyRole('MANAGER', 'HR', 'ADMIN')")
    public ResponseEntity<ApiResponse<GoalSetResponse>> revertToDraft(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(kpiService.revertToDraft(id)));
    }

    @PostMapping("/goal-set/{id}/lock")
    @PreAuthorize("hasAnyRole('MANAGER', 'HR', 'ADMIN')")
    public ResponseEntity<ApiResponse<GoalSetResponse>> lockGoalSet(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(kpiService.lockGoalSet(id)));
    }
}
