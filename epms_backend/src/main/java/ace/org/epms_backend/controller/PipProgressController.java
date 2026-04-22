package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.pip.PipProgressRequest;
import ace.org.epms_backend.dto.pip.PipProgressResponse;
import ace.org.epms_backend.service.PipProgressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping("/api/v1/pip/progress")
@RequiredArgsConstructor
public class PipProgressController {

    private final PipProgressService service;

    // Employee only
    @PreAuthorize("hasRole('EMPLOYEE')")
    @PostMapping
    public ResponseEntity<ApiResponse<PipProgressResponse>> addProgress(
            @Valid @RequestBody PipProgressRequest request
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(service.addProgress(request))
        );
    }

    // Manager + HR + Employee can view
    @PreAuthorize("hasAnyRole('HR','MANAGER','EMPLOYEE')")
    @GetMapping("/{objectiveId}")
    public ResponseEntity<ApiResponse<List<PipProgressResponse>>> getByObjective(
            @PathVariable Long objectiveId
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(service.getProgressByObjective(objectiveId))
        );
    }
}