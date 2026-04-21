package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.pip.PipCreateRequest;
import ace.org.epms_backend.dto.pip.PipResponse;
import ace.org.epms_backend.service.PipService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/pip")
@RequiredArgsConstructor
public class PipController {

    private final PipService pipService;

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
}