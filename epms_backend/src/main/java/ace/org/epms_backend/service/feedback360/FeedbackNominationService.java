package ace.org.epms_backend.service.feedback360;

import ace.org.epms_backend.dto.feedback360.NominationProposalRequest;
import ace.org.epms_backend.dto.feedback360.NominationResponse;

import java.util.List;

public interface FeedbackNominationService {
    NominationResponse propose(Long nominatedById, NominationProposalRequest request);
    List<NominationResponse> getMyNominations(Long nominatedById);
    NominationResponse approve(Long nominationId, Long approverId);
    NominationResponse reject(Long nominationId, Long approverId);
}
