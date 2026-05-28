package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.idp.DevelopmentProgressRequest;
import ace.org.epms_backend.dto.idp.DevelopmentProgressResponse;
import ace.org.epms_backend.service.DevelopmentProgressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/idp/progress")
@RequiredArgsConstructor
public class DevelopmentProgressController {

    private final DevelopmentProgressService progressService;

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{goalId}")
    public ResponseEntity<ApiResponse<List<DevelopmentProgressResponse>>> getByGoal(@PathVariable Long goalId) {
        return ResponseEntity.ok(ApiResponse.success(progressService.getByGoal(goalId)));
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping
    public ResponseEntity<ApiResponse<DevelopmentProgressResponse>> addProgress(
            @Valid @RequestBody DevelopmentProgressRequest request) {
        return ResponseEntity.ok(ApiResponse.success(progressService.addProgress(request)));
    }
}
