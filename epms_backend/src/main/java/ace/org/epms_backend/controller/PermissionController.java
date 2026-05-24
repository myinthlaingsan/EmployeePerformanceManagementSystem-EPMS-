package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.org.*;
import ace.org.epms_backend.service.PermissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/permissions")
@RequiredArgsConstructor
public class PermissionController {

    private final PermissionService permissionService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PermissionResponse>> createPermission(
            @Valid @RequestBody PermissionRequest request) {
        return new ResponseEntity<>(
                ApiResponse.success(
                        permissionService.createPermission(request)),
                HttpStatus.CREATED);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<ApiResponse<List<PermissionResponse>>> getAllPermissions() {
        return ResponseEntity.ok(
                ApiResponse.success(
                        permissionService.getAllPermissions()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<ApiResponse<PermissionResponse>> getPermissionById(@PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        permissionService.getPermissionById(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PermissionResponse>> updatePermission(
            @PathVariable Long id,
            @Valid @RequestBody PermissionRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        permissionService.updatePermission(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deletePermission(@PathVariable Long id) {
        permissionService.deletePermission(id);
        return ResponseEntity.ok(
                ApiResponse.success(null));
    }

    @PostMapping("/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> assignPermission(
            @Valid @RequestBody AssignPermissionRequest request) {
        permissionService.assignPermission(request);
        return new ResponseEntity<>(
                ApiResponse.success(null),
                HttpStatus.CREATED);
    }

    @DeleteMapping("/assign/{assignmentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> removeAssignedPermission(@PathVariable Long assignmentId) {
        permissionService.removeAssignedPermission(assignmentId);
        return ResponseEntity.ok(
                ApiResponse.success(null));
    }

    @GetMapping("/assign/{roleId}/{levelId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<ApiResponse<List<RoleLevelPermissionResponse>>> getAssignedPermissions(
            @PathVariable Long roleId, @PathVariable Long levelId) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        permissionService.getAssignedPermissions(roleId, levelId)));
    }

    @GetMapping("/matrix")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<ApiResponse<PermissionMatrixResponse>> getPermissionMatrix() {
        return ResponseEntity.ok(
                ApiResponse.success(
                        permissionService.getPermissionMatrix()));
    }

    @PostMapping("/matrix")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> updatePermissionMatrix(
            @Valid @RequestBody UpdatePermissionMatrixRequest request) {
        permissionService.updatePermissionMatrix(request);
        return ResponseEntity.ok(
                ApiResponse.success(null));
    }
}