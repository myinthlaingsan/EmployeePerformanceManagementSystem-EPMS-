package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.pip.PipCreateRequest;
import ace.org.epms_backend.dto.pip.PipExtendRequest;
import ace.org.epms_backend.dto.pip.PipResponse;
import ace.org.epms_backend.service.PipService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.security.access.prepost.PreAuthorize;
import java.util.List;

@RestController
@RequestMapping("/api/v1/pip")
@RequiredArgsConstructor
public class PipController {

    private final PipService pipService;

    @PreAuthorize("hasRole('HR')")
    @PostMapping
    public ResponseEntity<ApiResponse<PipResponse>> createPip(@Valid @RequestBody PipCreateRequest request) {
        return ResponseEntity.ok(ApiResponse.success(pipService.createPip(request)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PipResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(pipService.getPipById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PipResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(pipService.getAllPips()));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<ApiResponse<List<PipResponse>>> getByEmployee(@PathVariable Long employeeId) {
        return ResponseEntity.ok(ApiResponse.success(pipService.getPipsByEmployee(employeeId)));
    }

    @GetMapping("/involved/{userId}")
    public ResponseEntity<ApiResponse<List<PipResponse>>> getByInvolvedUser(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success(pipService.getPipsByInvolvedUser(userId)));
    }

    @PreAuthorize("hasRole('HR')")
    @PutMapping("/{id}/activate")
    public ResponseEntity<ApiResponse<Void>> activatePip(@PathVariable Long id) {
        pipService.activatePip(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PreAuthorize("hasRole('HR')")
    @PutMapping("/{id}/extend")
    public ResponseEntity<ApiResponse<PipResponse>> extendPip(@PathVariable Long id, @Valid @RequestBody PipExtendRequest request) {
        return ResponseEntity.ok(ApiResponse.success(pipService.extendPip(id, request.getNewEndDate())));
    }
}