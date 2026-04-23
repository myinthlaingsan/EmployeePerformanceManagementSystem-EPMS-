package ace.org.epms_backend.service.feedback360;

import ace.org.epms_backend.dto.feedback360.FeedbackRequestResponse;
import ace.org.epms_backend.model.appraisal.AppraisalCycle;
import java.util.List;

public interface FeedbackRequestService {
    void generate360FeedbackRequests(AppraisalCycle cycle);
    List<FeedbackRequestResponse> getMyPendingRequests(Long employeeId);
}
