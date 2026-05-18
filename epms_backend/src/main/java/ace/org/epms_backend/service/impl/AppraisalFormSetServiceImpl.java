package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.appraisal.AppraisalFormSetRequest;
import ace.org.epms_backend.dto.appraisal.AppraisalFormSetResponse;
import ace.org.epms_backend.enums.FormType;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.model.appraisal.AppraisalCycle;
import ace.org.epms_backend.model.appraisal.AppraisalForm;
import ace.org.epms_backend.model.appraisal.AppraisalFormSet;
import ace.org.epms_backend.repository.AppraisalCycleRepository;
import ace.org.epms_backend.repository.AppraisalFormRepository;
import ace.org.epms_backend.repository.AppraisalRepository;
import ace.org.epms_backend.repository.appraisal.AppraisalFormSetRepository;
import ace.org.epms_backend.service.AppraisalFormSetService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AppraisalFormSetServiceImpl implements AppraisalFormSetService {

    private final AppraisalFormSetRepository formSetRepo;
    private final AppraisalFormRepository formRepo;
    private final AppraisalCycleRepository cycleRepo;
    private final AppraisalRepository appraisalRepo;

    @Override
    public List<AppraisalFormSetResponse> getAllFormSets() {
        return formSetRepo.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AppraisalFormSetResponse createFormSet(AppraisalFormSetRequest request) {
        // Validation: Check for duplicates in the same cycle
        if (formSetRepo.existsByCycle_CycleIdAndName(request.getCycleId(), request.getName())) {
            throw new RuntimeException("Form set with name '" + request.getName() + "' already exists for this cycle.");
        }

        AppraisalCycle cycle = cycleRepo.findById(request.getCycleId())
                .orElseThrow(() -> new NotFoundException("Cycle not found"));
        
        AppraisalFormSet set = AppraisalFormSet.builder()
                .name(request.getName())
                .cycle(cycle)
                .isActive(true)
                .build();
        
        AppraisalFormSet saved = formSetRepo.save(set);
        return toResponse(saved);
    }

    @Override
    public List<AppraisalFormSetResponse> getByCycle(Long cycleId) {
        return formSetRepo.findByCycle_CycleId(cycleId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public String syncFormSets() {
        List<AppraisalForm> allForms = formRepo.findAll();
        
        var grouped = allForms.stream().collect(Collectors.groupingBy(
            f -> f.getCycle().getCycleId() + "_" + f.getFormName().trim().toLowerCase()
        ));

        int created = 0;
        int skipped = 0;
        int unmatched = 0;

        for (var entry : grouped.entrySet()) {
            var forms = entry.getValue();
            var self = forms.stream().filter(f -> f.getFormType() == FormType.SELF_ASSESSMENT).findFirst();
            var eval = forms.stream().filter(f -> f.getFormType() == FormType.MANAGER_EVALUATION).findFirst();

            if (self.isPresent() && eval.isPresent()) {
                // Check if set already exists
                boolean exists = formSetRepo.existsByCycle_CycleIdAndName(
                    self.get().getCycle().getCycleId(), 
                    self.get().getFormName().trim()
                );

                if (!exists) {
                    AppraisalFormSet set = AppraisalFormSet.builder()
                        .name(self.get().getFormName().trim())
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

        return String.format("Sync complete. Created: %d, Already Exists: %d, Unmatched Forms: %d", 
                             created, skipped, unmatched);
    }

    @Override
    @Transactional
    public AppraisalFormSetResponse updateFormSet(Long id, AppraisalFormSetRequest request) {
        AppraisalFormSet set = formSetRepo.findById(id)
                .orElseThrow(() -> new NotFoundException("Form set not found"));
        
        // Validation: Check for duplicates if name/cycle changed
        if (!set.getName().equals(request.getName()) || !set.getCycle().getCycleId().equals(request.getCycleId())) {
            if (formSetRepo.existsByCycle_CycleIdAndName(request.getCycleId(), request.getName())) {
                throw new RuntimeException("Form set with name '" + request.getName() + "' already exists for this cycle.");
            }
        }

        AppraisalCycle cycle = cycleRepo.findById(request.getCycleId())
                .orElseThrow(() -> new NotFoundException("Cycle not found"));
        
        set.setName(request.getName());
        set.setCycle(cycle);
        
        AppraisalFormSet saved = formSetRepo.save(set);
        return toResponse(saved);
    }

    @Override
    public void deleteFormSet(Long id) {
        if (appraisalRepo.existsByFormSet_Id(id)) {
            throw new RuntimeException("Cannot delete form set as it is already assigned to appraisals.");
        }
        formSetRepo.deleteById(id);
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
                .isAssigned(appraisalRepo.existsByFormSet_Id(set.getId()))
                .build();
    }
}
