package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.appraisal.AppraisalCycleResponse;
import ace.org.epms_backend.dto.kpi.*;
import ace.org.epms_backend.dto.PagedResponse;
import ace.org.epms_backend.service.kpi.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/kpi")
@RequiredArgsConstructor
public class KpiController {

    private final KpiLibraryService libraryService;
    private final KpiGoalService goalService;
    private final KpiProgressService progressService;
    private final KpiScoringService scoringService;

    @GetMapping("/active-cycle")
    public ResponseEntity<ApiResponse<AppraisalCycleResponse>> getActiveCycle() {
        return ResponseEntity.ok(ApiResponse.success(goalService.getActiveCycle()));
    }

    // 1. KPI Library Management (HR/Admin)
    @PostMapping("/library")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public ResponseEntity<ApiResponse<KpiLibraryResponse>> createLibrary(
            @Valid @RequestBody KpiLibraryRequest request) {
        return ResponseEntity.ok(ApiResponse.success(libraryService.createLibrary(request)));
    }

    @GetMapping("/library")
    public ResponseEntity<ApiResponse<List<KpiLibraryResponse>>> getAllLibraries() {
        return ResponseEntity.ok(ApiResponse.success(libraryService.getAllActiveLibraries()));
    }

    @PostMapping("/library/import")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public ResponseEntity<ApiResponse<KpiImportResult>> importLibraries(
            @RequestParam("file") MultipartFile file) throws IOException {
        
        String filename = file.getOriginalFilename();
        if (filename == null || !filename.toLowerCase().endsWith(".xlsx")) {
            throw new IllegalArgumentException("Invalid file format. Only .xlsx files are supported.");
        }
        
        return ResponseEntity.ok(ApiResponse.success(libraryService.importLibraries(file)));
    }

    @PatchMapping("/library/{id}/status")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public ResponseEntity<ApiResponse<KpiLibraryResponse>> toggleLibraryStatus(@PathVariable Long id,
            @RequestParam boolean active) {
        return ResponseEntity.ok(ApiResponse.success(libraryService.toggleLibraryStatus(id, active)));
    }

    // 2. KPI Assignment (Manager/HR/Admin)
    @PostMapping("/assign")
    @PreAuthorize("hasAnyRole('MANAGER', 'HR', 'ADMIN')")
    public ResponseEntity<ApiResponse<GoalSetResponse>> assignKpi(@Valid @RequestBody GoalAssignmentRequest request) {
        return ResponseEntity.ok(ApiResponse.success(goalService.assignKpiToEmployee(request)));
    }

    @PostMapping("/bulk-assign")
    @PreAuthorize("hasAnyRole('MANAGER', 'HR', 'ADMIN')")
    public ResponseEntity<ApiResponse<BulkAssignmentResponse>> bulkAssignKpi(@Valid @RequestBody BulkGoalAssignmentRequest request) {
        return ResponseEntity.ok(ApiResponse.success(goalService.bulkAssignKpi(request)));
    }

    // 3. Goal Item Management (Manager/HR/Admin - Pre-Approval)
    @PostMapping("/goal-set/{goalSetId}/items")
    @PreAuthorize("hasAnyRole('MANAGER', 'HR', 'ADMIN')")
    public ResponseEntity<ApiResponse<GoalSetResponse>> addGoalItem(@PathVariable Long goalSetId,
            @Valid @RequestBody KpiGoalItemRequest request) {
        return ResponseEntity.ok(ApiResponse.success(goalService.addGoalItem(goalSetId, request)));
    }

    @PutMapping("/items/{itemId}")
    @PreAuthorize("hasAnyRole('MANAGER', 'HR', 'ADMIN')")
    public ResponseEntity<ApiResponse<GoalSetResponse>> updateGoalItem(@PathVariable Long itemId,
            @Valid @RequestBody KpiGoalItemRequest request) {
        return ResponseEntity.ok(ApiResponse.success(goalService.updateGoalItem(itemId, request)));
    }

    @DeleteMapping("/items/{itemId}")
    @PreAuthorize("hasAnyRole('MANAGER', 'HR', 'ADMIN')")
    public ResponseEntity<ApiResponse<GoalSetResponse>> deleteGoalItem(@PathVariable Long itemId) {
        return ResponseEntity.ok(ApiResponse.success(goalService.deleteGoalItem(itemId)));
    }

    // 4. Goal Approval
    @PostMapping("/approve/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'HR', 'ADMIN')")
    public ResponseEntity<ApiResponse<GoalSetResponse>> approveGoals(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(goalService.approveGoalSet(id)));
    }

    // 4. KPI Progress (Employee & Manager)
    @PostMapping("/progress")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'HR', 'ADMIN')")
    public ResponseEntity<ApiResponse<GoalSetResponse>> updateProgress(@Valid @RequestBody ProgressRequest request) {
        return ResponseEntity.ok(ApiResponse.success(progressService.updateProgress(request)));
    }

    // 5. KPI Revision (Manager)
    @PutMapping("/revise/{itemId}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<GoalSetResponse>> reviseKpi(@PathVariable Long itemId,
            @Valid @RequestBody KpiRevisionRequest request) {
        return ResponseEntity.ok(ApiResponse.success(goalService.reviseKpi(itemId, request)));
    }

    // 6. KPI Score Calculation (System/Manager)
//    @RequestMapping("/api/v1/kpi")
    @PostMapping("/calculate-score")
    @PreAuthorize("hasAnyRole('MANAGER', 'HR')")
    public ResponseEntity<ApiResponse<KpiScoreResponse>> calculateScore(@RequestParam Long employeeId,
            @RequestParam Long cycleId) {
        return ResponseEntity.ok(ApiResponse.success(scoringService.calculateFinalScore(employeeId, cycleId)));
    }

    // 7. Goal Set Retrieval
    @GetMapping("/goal-set/employee/{employeeId}")
    public ResponseEntity<ApiResponse<GoalSetResponse>> getGoalSetByEmployee(
            @PathVariable Long employeeId, @RequestParam Long cycleId) {
        return ResponseEntity.ok(ApiResponse.success(goalService.getGoalSetByEmployee(employeeId, cycleId)));
    }

    @GetMapping("/goal-set/{id}")
    public ResponseEntity<ApiResponse<GoalSetResponse>> getGoalSetById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(goalService.getGoalSetById(id)));
    }

    @PutMapping("/goal-set/{id}/bulk-items")
    @PreAuthorize("hasAnyRole('MANAGER', 'HR', 'ADMIN')")
    public ResponseEntity<ApiResponse<GoalSetResponse>> bulkUpdateItems(
            @PathVariable Long id, @RequestBody KpiGoalBulkUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success(goalService.bulkUpdateGoalItems(id, request)));
    }

    @GetMapping("/progress/history")
    public ResponseEntity<ApiResponse<List<KpiProgressResponse>>> getRecentProgress(@RequestParam Long employeeId,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(ApiResponse.success(progressService.getRecentProgress(employeeId, limit)));
    }

    // --- New Endpoints based on KPI Module Expansion Plan ---

    @GetMapping("/library/{id}")
    public ResponseEntity<ApiResponse<KpiLibraryResponse>> getLibraryById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(libraryService.getLibraryById(id)));
    }

    @PutMapping("/library/{id}")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public ResponseEntity<ApiResponse<KpiLibraryResponse>> updateLibrary(
            @PathVariable Long id, @Valid @RequestBody KpiLibraryRequest request) {
        return ResponseEntity.ok(ApiResponse.success(libraryService.updateLibrary(id, request)));
    }

    @PostMapping("/library/{id}/clone")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public ResponseEntity<ApiResponse<KpiLibraryResponse>> cloneLibrary(
            @PathVariable Long id, @RequestParam String newTitle) {
        return ResponseEntity.ok(ApiResponse.success(libraryService.cloneLibrary(id, newTitle)));
    }

    @GetMapping("/library/search")
    public ResponseEntity<ApiResponse<PagedResponse<KpiLibraryResponse>>> searchLibraries(
            @RequestParam String keyword, @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(libraryService.searchLibraries(keyword, page, size)));
    }

    // The submit and reject endpoints have been removed for the top-down approval workflow.

    @GetMapping("/goal-set/employee/all/{employeeId}")
    public ResponseEntity<ApiResponse<List<GoalSetResponse>>> getEmployeeGoalSets(@PathVariable Long employeeId) {
        return ResponseEntity.ok(ApiResponse.success(goalService.getEmployeeGoalSets(employeeId)));
    }

    @GetMapping("/goal-set/team")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<List<GoalSetResponse>>> getTeamGoalSets(
            @RequestParam Long managerId, @RequestParam Long cycleId) {
        return ResponseEntity.ok(ApiResponse.success(goalService.getTeamGoalSets(managerId, cycleId)));
    }

    @GetMapping("/goal-set/department")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<GoalSetResponse>>> getDepartmentGoalSets(
            @RequestParam(required = false) Long departmentId, @RequestParam Long cycleId) {
        return ResponseEntity.ok(ApiResponse.success(goalService.getDepartmentGoalSets(departmentId, cycleId)));
    }

    @PostMapping("/goal-set/{id}/revert")
    @PreAuthorize("hasAnyRole('MANAGER', 'HR', 'ADMIN')")
    public ResponseEntity<ApiResponse<GoalSetResponse>> revertToDraft(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(goalService.revertToDraft(id)));
    }

    @PostMapping("/goal-set/{id}/lock")
    @PreAuthorize("hasAnyRole('MANAGER', 'HR', 'ADMIN')")
    public ResponseEntity<ApiResponse<GoalSetResponse>> lockGoalSet(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(goalService.lockGoalSet(id)));
    }
}
