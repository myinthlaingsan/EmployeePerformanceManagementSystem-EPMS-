package ace.org.epms_backend.controller.appraisal;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.appraisal.AppraisalFormSetRequest;
import ace.org.epms_backend.dto.appraisal.AppraisalFormSetResponse;
import ace.org.epms_backend.model.appraisal.AppraisalCycle;
import ace.org.epms_backend.model.appraisal.AppraisalFormSet;
import ace.org.epms_backend.repository.AppraisalCycleRepository;
import ace.org.epms_backend.repository.AppraisalFormRepository;
import ace.org.epms_backend.repository.appraisal.AppraisalFormSetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/appraisal-form-sets")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'HR')")
public class AppraisalFormSetController {

    private final AppraisalFormSetRepository formSetRepo;
    private final AppraisalFormRepository formRepo;
    private final AppraisalCycleRepository cycleRepo;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AppraisalFormSetResponse>>> getAllFormSets() {
        List<AppraisalFormSetResponse> responses = formSetRepo.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AppraisalFormSetResponse>> createFormSet(@RequestBody AppraisalFormSetRequest request) {
        AppraisalCycle cycle = cycleRepo.findById(request.getCycleId())
                .orElseThrow(() -> new ace.org.epms_backend.exception.NotFoundException("Cycle not found"));
        
        AppraisalFormSet set = AppraisalFormSet.builder()
                .name(request.getName())
                .cycle(cycle)
                .isActive(true)
                .build();
        
        AppraisalFormSet saved = formSetRepo.save(set);
        return ResponseEntity.ok(ApiResponse.success(toResponse(saved)));
    }

    @GetMapping("/cycle/{cycleId}")
    public ResponseEntity<ApiResponse<List<AppraisalFormSetResponse>>> getByCycle(@PathVariable Long cycleId) {
        List<AppraisalFormSetResponse> responses = formSetRepo.findByCycle_CycleId(cycleId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @PostMapping("/sync")
    @Transactional
    public ResponseEntity<ApiResponse<String>> syncFormSets() {
        // Find all forms
        List<ace.org.epms_backend.model.appraisal.AppraisalForm> allForms = formRepo.findAll();
        
        // Group by cycle and normalized name
        var grouped = allForms.stream().collect(Collectors.groupingBy(
            f -> f.getCycle().getCycleId() + "_" + f.getFormName().trim().toLowerCase()
        ));

        int created = 0;
        int skipped = 0;
        int unmatched = 0;

        for (var entry : grouped.entrySet()) {
            var forms = entry.getValue();
            var self = forms.stream().filter(f -> f.getFormType() == ace.org.epms_backend.enums.FormType.SELF_ASSESSMENT).findFirst();
            var eval = forms.stream().filter(f -> f.getFormType() == ace.org.epms_backend.enums.FormType.MANAGER_EVALUATION).findFirst();

            if (self.isPresent() && eval.isPresent()) {
                // Check if set already exists
                boolean exists = formSetRepo.findAll().stream().anyMatch(s -> 
                    s.getSelfAssessmentForm().getFormId().equals(self.get().getFormId()) &&
                    s.getManagerEvaluationForm().getFormId().equals(eval.get().getFormId())
                );

                if (!exists) {
                    AppraisalFormSet set = AppraisalFormSet.builder()
                        .name(self.get().getFormName().trim()) // Use the trimmed name
                        .cycle(self.get().getCycle())
                        .selfAssessmentForm(self.get())
                        .managerEvaluationForm(eval.get())
                        .isActive(true)
                        .build();
                    formSetRepo.save(set);
                    created++;
                } else {
                    skipped++;
                }
            } else {
                unmatched++;
            }
        }

        String summary = String.format("Sync complete. Created: %d, Already Exists: %d, Unmatched Forms: %d", 
                                       created, skipped, unmatched);
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    private AppraisalFormSetResponse toResponse(AppraisalFormSet set) {
        return AppraisalFormSetResponse.builder()
                .id(set.getId())
                .name(set.getName())
                .cycleId(set.getCycle() != null ? set.getCycle().getCycleId() : null)
                .cycleName(set.getCycle() != null ? set.getCycle().getCycleName() : null)
                .selfAssessmentFormId(set.getSelfAssessmentForm() != null ? set.getSelfAssessmentForm().getFormId() : null)
                .selfAssessmentFormName(set.getSelfAssessmentForm() != null ? set.getSelfAssessmentForm().getFormName() : null)
                .managerEvaluationFormId(set.getManagerEvaluationForm() != null ? set.getManagerEvaluationForm().getFormId() : null)
                .managerEvaluationFormName(set.getManagerEvaluationForm() != null ? set.getManagerEvaluationForm().getFormName() : null)
                .build();
    }
}
