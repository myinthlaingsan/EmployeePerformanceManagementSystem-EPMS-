package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.pip.PipReviewRequest;
import ace.org.epms_backend.dto.pip.PipReviewResponse;
import ace.org.epms_backend.enums.PipOutcome;

import java.util.List;

public interface PipReviewService {

    PipReviewResponse createReview(PipReviewRequest request);

    List<PipReviewResponse> getReviewsByPip(Long pipId);

    void finalizePip(Long pipId, PipOutcome outcome, String comment);
}
