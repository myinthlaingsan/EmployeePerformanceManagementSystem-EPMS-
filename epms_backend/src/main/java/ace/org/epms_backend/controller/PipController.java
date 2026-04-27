package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.pip.PipCreateRequest;
import ace.org.epms_backend.dto.pip.PipExtendRequest;
import ace.org.epms_backend.dto.pip.PipResponse;
import ace.org.epms_backend.service.PipService;
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
    public ResponseEntity<PipResponse> createPip(@RequestBody PipCreateRequest request) {
        return ResponseEntity.ok(pipService.createPip(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PipResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(pipService.getPipById(id));
    }

    @GetMapping
    public ResponseEntity<List<PipResponse>> getAll() {
        return ResponseEntity.ok(pipService.getAllPips());
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<PipResponse>> getByEmployee(@PathVariable Long employeeId) {
        return ResponseEntity.ok(pipService.getPipsByEmployee(employeeId));
    }

    @GetMapping("/involved/{userId}")
    public ResponseEntity<List<PipResponse>> getByInvolvedUser(@PathVariable Long userId) {
        return ResponseEntity.ok(pipService.getPipsByInvolvedUser(userId));
    }

    @PreAuthorize("hasRole('HR')")
    @PutMapping("/{id}/activate")
    public ResponseEntity<Void> activatePip(@PathVariable Long id) {
        pipService.activatePip(id);
        return ResponseEntity.ok().build();
    }

    @PreAuthorize("hasRole('HR')")
    @PutMapping("/{id}/extend")
    public ResponseEntity<PipResponse> extendPip(@PathVariable Long id, @RequestBody PipExtendRequest request) {
        return ResponseEntity.ok(pipService.extendPip(id, request.getNewEndDate()));
    }
}