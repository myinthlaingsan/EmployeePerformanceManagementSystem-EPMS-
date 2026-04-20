package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.org.PositionRequest;
import ace.org.epms_backend.dto.org.PositionResponse;
import ace.org.epms_backend.service.PositionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/positions")
@RequiredArgsConstructor
public class PositionController {

    private final PositionService positionService;

    @PostMapping
    public ResponseEntity<ApiResponse<PositionResponse>> createPosition(@Valid @RequestBody PositionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(positionService.createPosition(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PositionResponse>>> getPositions(@RequestParam(required = false) Long levelId) {
        if (levelId != null) {
            return ResponseEntity.ok(ApiResponse.success(positionService.getPositionsByLevelId(levelId)));
        }
        return ResponseEntity.ok(ApiResponse.success(positionService.getAllPositions()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PositionResponse>> getPositionById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(positionService.getPositionById(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PositionResponse>> updatePosition(
            @PathVariable Long id, @Valid @RequestBody PositionRequest request) {
        return ResponseEntity.ok(ApiResponse.success(positionService.updatePosition(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePosition(@PathVariable Long id) {
        positionService.deletePosition(id);
        return ResponseEntity.ok(ApiResponse.success());
    }
}
