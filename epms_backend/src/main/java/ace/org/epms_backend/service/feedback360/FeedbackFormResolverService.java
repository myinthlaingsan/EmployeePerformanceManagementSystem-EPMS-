package ace.org.epms_backend.service.feedback360;

import ace.org.epms_backend.enums.FeedbackRelationship;
import ace.org.epms_backend.model.appraisal.AppraisalForm;
import ace.org.epms_backend.model.employee.Employee;

public interface FeedbackFormResolverService {

    AppraisalForm resolveForm(
        Employee employee,
        FeedbackRelationship relationship,
        Long cycleId
    );
}
