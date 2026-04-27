package ace.org.epms_backend.service.feedback360;

import ace.org.epms_backend.dto.feedback360.FeedbackSummaryResponse;

public interface  FeedbackReportService {
    FeedbackSummaryResponse getFeedbackSummary(Long targetUserId, Long cycleId);
}
