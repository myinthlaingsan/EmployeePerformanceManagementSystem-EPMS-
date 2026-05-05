package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.pip.PipObjectiveRequest;
import ace.org.epms_backend.dto.pip.PipObjectiveResponse;
import ace.org.epms_backend.dto.pip.PipObjectiveUpdateRequest;
import ace.org.epms_backend.enums.ObjectiveStatus;
import ace.org.epms_backend.service.PipObjectiveService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping("/api/v1/pip/objectives")
@RequiredArgsConstructor
public class PipObjectiveController {

    private final PipObjectiveService service;

    // HR or Manager updates objective details
    @PreAuthorize("hasAnyRole('HR','MANAGER')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PipObjectiveResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody PipObjectiveUpdateRequest request
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(service.updateObjective(id, request))
        );
    }

    // HR or Manager creates objective
    @PreAuthorize("hasAnyRole('HR','MANAGER')")
    @PostMapping
    public ResponseEntity<ApiResponse<PipObjectiveResponse>> create(
            @Valid @RequestBody PipObjectiveRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(service.createObjective(request)));
    }

    // Employee + Manager + HR view
    @PreAuthorize("hasAnyRole('HR','MANAGER','EMPLOYEE')")
    @GetMapping("/{pipId}")
    public ResponseEntity<ApiResponse<List<PipObjectiveResponse>>> getByPip(
            @PathVariable Long pipId
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(service.getByPipId(pipId))
        );
    }

    // HR or Manager updates status
    @PreAuthorize("hasAnyRole('HR','MANAGER')")
    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<PipObjectiveResponse>> updateStatus(
            @PathVariable Long id,
            @RequestParam ObjectiveStatus status
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(service.updateObjectiveStatus(id, status))
        );
    }
}