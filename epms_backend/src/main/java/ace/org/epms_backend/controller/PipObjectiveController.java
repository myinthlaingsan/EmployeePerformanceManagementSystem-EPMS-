package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.pip.PipObjectiveRequest;
import ace.org.epms_backend.dto.pip.PipObjectiveResponse;
import ace.org.epms_backend.service.PipObjectiveService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/pip/objectives")
@RequiredArgsConstructor
public class PipObjectiveController {

    private final PipObjectiveService service;

    @PostMapping
    public ResponseEntity<PipObjectiveResponse> create(@RequestBody PipObjectiveRequest request) {
        return ResponseEntity.ok(service.createObjective(request));
    }

    @GetMapping("/{pipId}")
    public ResponseEntity<List<PipObjectiveResponse>> getByPip(@PathVariable Long pipId) {
        return ResponseEntity.ok(service.getByPipId(pipId));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<PipObjectiveResponse> updateStatus(
            @PathVariable Long id,
            @RequestParam Boolean achieved
    ) {
        return ResponseEntity.ok(service.updateObjectiveStatus(id, achieved));
    }
}