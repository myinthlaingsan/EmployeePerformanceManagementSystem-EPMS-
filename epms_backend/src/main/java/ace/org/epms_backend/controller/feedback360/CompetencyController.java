package ace.org.epms_backend.controller.feedback360;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.feedback360.CompetencyRequest;
import ace.org.epms_backend.dto.feedback360.CompetencyResponse;
import ace.org.epms_backend.service.feedback360.CompetencyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/competency")
@RequiredArgsConstructor
public class CompetencyController {

    private final CompetencyService competencyService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CompetencyResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(competencyService.getAllActive()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    public ResponseEntity<ApiResponse<CompetencyResponse>> create(
            @Valid @RequestBody CompetencyRequest request) {
        CompetencyResponse created = competencyService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Competency created", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    public ResponseEntity<ApiResponse<CompetencyResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody CompetencyRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Competency updated", competencyService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        competencyService.delete(id);
        return ResponseEntity.ok(ApiResponse.success());
    }
}
