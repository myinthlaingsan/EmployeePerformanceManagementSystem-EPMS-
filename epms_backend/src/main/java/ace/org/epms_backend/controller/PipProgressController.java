package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.pip.PipProgressRequest;
import ace.org.epms_backend.dto.pip.PipProgressResponse;
import ace.org.epms_backend.service.PipProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/pip/progress")
@RequiredArgsConstructor
public class PipProgressController {

    private final PipProgressService service;

    @PostMapping
    public ResponseEntity<PipProgressResponse> addProgress(@RequestBody PipProgressRequest request) {
        return ResponseEntity.ok(service.addProgress(request));
    }

    @GetMapping("/{objectiveId}")
    public ResponseEntity<List<PipProgressResponse>> getByObjective(@PathVariable Long objectiveId) {
        return ResponseEntity.ok(service.getProgressByObjective(objectiveId));
    }
}