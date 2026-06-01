package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.idp.IdpCreateRequest;
import ace.org.epms_backend.dto.idp.IdpResponse;
import ace.org.epms_backend.dto.idp.IdpUpdateRequest;
import ace.org.epms_backend.service.IdpService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/idp")
@RequiredArgsConstructor
public class IdpController {

    private final IdpService idpService;

    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    @PostMapping
    public ResponseEntity<ApiResponse<IdpResponse>> create(@Valid @RequestBody IdpCreateRequest request) {
        return ResponseEntity.ok(ApiResponse.success(idpService.createIdp(request)));
    }

    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    @GetMapping
    public ResponseEntity<ApiResponse<List<IdpResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(idpService.getAll()));
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<IdpResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(idpService.getById(id)));
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<ApiResponse<List<IdpResponse>>> getByEmployee(@PathVariable Long employeeId) {
        return ResponseEntity.ok(ApiResponse.success(idpService.getByEmployee(employeeId)));
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/involved/{userId}")
    public ResponseEntity<ApiResponse<List<IdpResponse>>> getByInvolvedUser(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success(idpService.getByInvolvedUser(userId)));
    }

    @PreAuthorize("hasAnyRole('HR', 'ADMIN', 'MANAGER')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<IdpResponse>> update(@PathVariable Long id, @Valid @RequestBody IdpUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success(idpService.updateIdp(id, request)));
    }

    @PreAuthorize("hasAnyRole('HR', 'ADMIN', 'MANAGER')")
    @PutMapping("/{id}/activate")
    public ResponseEntity<ApiResponse<IdpResponse>> activate(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(idpService.activate(id)));
    }

    @PreAuthorize("hasAnyRole('HR', 'ADMIN', 'MANAGER')")
    @PutMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<IdpResponse>> complete(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(idpService.complete(id)));
    }

    @PreAuthorize("hasAnyRole('HR', 'ADMIN', 'MANAGER')")
    @PutMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<IdpResponse>> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(idpService.cancel(id)));
    }

    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        idpService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
