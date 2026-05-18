package ace.org.epms_backend.service.feedback360;

import ace.org.epms_backend.dto.feedback360.FeedbackSummaryResponse;
import org.springframework.stereotype.Service;

@Service
public interface  FeedbackReportService {
    FeedbackSummaryResponse getFeedbackSummary(Long targetUserId, Long cycleId);
}
