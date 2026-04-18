package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.org.JobLevelRequest;
import ace.org.epms_backend.dto.org.JobLevelResponse;
import ace.org.epms_backend.service.JobLevelService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/org/job-levels")
@RequiredArgsConstructor
public class JobLevelController {
    private final JobLevelService jobLevelService;

    @PostMapping
    public ResponseEntity<ApiResponse<JobLevelResponse>> createJobLevel(@Valid @RequestBody JobLevelRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(jobLevelService.createJobLevel(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<JobLevelResponse>>> getAllJobLevels() {
        return ResponseEntity.ok(ApiResponse.success(jobLevelService.getAllJobLevels()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<JobLevelResponse>> getJobLevelById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(jobLevelService.getJobLevelById(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<JobLevelResponse>> updateJobLevel(
            @PathVariable Long id, @Valid @RequestBody JobLevelRequest request) {
        return ResponseEntity.ok(ApiResponse.success(jobLevelService.updateJobLevel(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> deleteJobLevel(@PathVariable Long id) {
        jobLevelService.deleteJobLevel(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
