package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.idp.DevelopmentGoalRequest;
import ace.org.epms_backend.dto.idp.DevelopmentGoalResponse;
import ace.org.epms_backend.dto.idp.DevelopmentGoalUpdateRequest;
import ace.org.epms_backend.enums.DevelopmentGoalStatus;
import ace.org.epms_backend.service.DevelopmentGoalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/idp/goals")
@RequiredArgsConstructor
public class DevelopmentGoalController {

    private final DevelopmentGoalService goalService;

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{idpId}")
    public ResponseEntity<ApiResponse<List<DevelopmentGoalResponse>>> getByPlan(@PathVariable Long idpId) {
        return ResponseEntity.ok(ApiResponse.success(goalService.getByPlan(idpId)));
    }

    @PreAuthorize("hasAnyRole('HR', 'ADMIN', 'MANAGER')")
    @PostMapping
    public ResponseEntity<ApiResponse<DevelopmentGoalResponse>> create(@Valid @RequestBody DevelopmentGoalRequest request) {
        return ResponseEntity.ok(ApiResponse.success(goalService.createGoal(request)));
    }

    @PreAuthorize("hasAnyRole('HR', 'ADMIN', 'MANAGER')")
    @PutMapping("/{goalId}")
    public ResponseEntity<ApiResponse<DevelopmentGoalResponse>> update(
            @PathVariable Long goalId,
            @Valid @RequestBody DevelopmentGoalUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success(goalService.updateGoal(goalId, request)));
    }

    @PreAuthorize("hasAnyRole('HR', 'ADMIN', 'MANAGER')")
    @PutMapping("/{goalId}/status")
    public ResponseEntity<ApiResponse<DevelopmentGoalResponse>> updateStatus(
            @PathVariable Long goalId,
            @RequestParam DevelopmentGoalStatus status) {
        return ResponseEntity.ok(ApiResponse.success(goalService.updateStatus(goalId, status)));
    }

    @PreAuthorize("hasAnyRole('HR', 'ADMIN', 'MANAGER')")
    @DeleteMapping("/{goalId}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long goalId) {
        goalService.deleteGoal(goalId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
