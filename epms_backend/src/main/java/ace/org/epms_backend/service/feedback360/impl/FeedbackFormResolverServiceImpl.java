package ace.org.epms_backend.service.feedback360.impl;

import ace.org.epms_backend.enums.FeedbackRelationship;
import ace.org.epms_backend.model.appraisal.AppraisalForm;
import ace.org.epms_backend.model.appraisal.AppraisalFormSet;
import ace.org.epms_backend.model.employee.Department;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.employee.JobLevel;
import ace.org.epms_backend.model.feedback360.DepartmentFeedbackConfig;
import ace.org.epms_backend.repository.EmployeeDepartmentRepository;
import ace.org.epms_backend.repository.feedback360.DepartmentFeedbackConfigRepository;
import ace.org.epms_backend.service.feedback360.FeedbackFormResolverService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FeedbackFormResolverServiceImpl implements FeedbackFormResolverService {

    private final DepartmentFeedbackConfigRepository configRepository;
    private final EmployeeDepartmentRepository departmentRepository;

    @Override
    public AppraisalForm resolveForm(Employee employee, FeedbackRelationship relationship, Long cycleId) {
        Department department = departmentRepository.findFirstByEmployeeIdAndIsCurrentTrue(employee.getId())
            .map(ed -> ed.getCurrentDepartment())
            .orElse(null);
        
        JobLevel jobLevel = employee.getLevel();

        // Step 1: Find department + job level config
        DepartmentFeedbackConfig config = configRepository
            .findByDepartmentAndJobLevelAndIsActiveTrue(department, jobLevel)
            .orElseGet(() -> 
                // Step 2: Fallback to default config
                configRepository.findByIsDefaultTrueAndIsActiveTrue()
                .orElseThrow(() -> new RuntimeException("No feedback configuration found for department: " 
                    + (department != null ? department.getDepartmentName() : "Unknown") 
                    + " and level: " + (jobLevel != null ? jobLevel.getLevelName() : "Unknown")))
            );

        // Step 3: Validate config and form set
        AppraisalFormSet formSet = config.getFormSet();
        if (formSet == null) {
            throw new RuntimeException("No form set assigned to the feedback configuration");
        }

        // Validate cycle matches if needed (optional based on plan, but good for safety)
        if (formSet.getCycle() != null && !formSet.getCycle().getCycleId().equals(cycleId)) {
            // Log or throw if cycle mismatch is critical
        }

        // Step 4: Resolve relationship-specific form
        AppraisalForm resolvedForm = resolveRelationshipForm(formSet, relationship);
        
        if (resolvedForm == null) {
            throw new RuntimeException("No form found for relationship: " + relationship + " in form set: " + formSet.getName());
        }

        return resolvedForm;
    }

    private AppraisalForm resolveRelationshipForm(AppraisalFormSet formSet, FeedbackRelationship relationship) {
        return switch (relationship) {
            case SELF -> formSet.getSelfFeedbackForm();
            case MANAGER, DIRECT_MANAGER, SUPERIOR -> formSet.getManagerFeedbackForm();
            case PEER -> formSet.getPeerFeedbackForm();
            case SUBORDINATE -> formSet.getSubordinateFeedbackForm();
        };
    }
}
