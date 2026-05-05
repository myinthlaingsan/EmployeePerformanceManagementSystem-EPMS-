package ace.org.epms_backend.controller.feedback360;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.feedback360.DepartmentFeedbackConfigDTO;
import ace.org.epms_backend.service.feedback360.DepartmentFeedbackConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/feedback/config")
@RequiredArgsConstructor
public class DepartmentFeedbackConfigController {

    private final DepartmentFeedbackConfigService configService;

    @PostMapping
    public ResponseEntity<ApiResponse<DepartmentFeedbackConfigDTO>> saveOrUpdate(@RequestBody DepartmentFeedbackConfigDTO dto) {
        return ResponseEntity.ok(ApiResponse.success(configService.saveOrUpdate(dto)));
    }

    @PostMapping("/set-limit")
    public ResponseEntity<ApiResponse<DepartmentFeedbackConfigDTO>> setLimit(
            @RequestParam Long deptId,
            @RequestParam Long levelId,
            @RequestParam Integer maxPeers,
            @RequestParam Integer maxSubs) {
        DepartmentFeedbackConfigDTO dto = DepartmentFeedbackConfigDTO.builder()
                .departmentId(deptId)
                .levelId(levelId)
                .maxPeers(maxPeers)
                .maxSubordinates(maxSubs)
                .allowCrossDepartment(false)
                .build();
        return ResponseEntity.ok(ApiResponse.success(configService.saveOrUpdate(dto)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<DepartmentFeedbackConfigDTO>>> getAllConfigs() {
        return ResponseEntity.ok(ApiResponse.success(configService.getAllConfigs()));
    }

    @GetMapping("/department/{deptId}")
    public ResponseEntity<ApiResponse<List<DepartmentFeedbackConfigDTO>>> getConfigByDept(@PathVariable Long deptId) {
        return ResponseEntity.ok(ApiResponse.success(configService.getConfigByDepartmentId(deptId)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> deleteConfig(@PathVariable Long id) {
        configService.deleteConfig(id);
        return ResponseEntity.ok(ApiResponse.success("Configuration deleted successfully"));
    }
}