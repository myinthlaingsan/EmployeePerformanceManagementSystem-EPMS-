package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.model.appraisal.Appraisal;
import ace.org.epms_backend.model.appraisal.UnlockRequest;
import ace.org.epms_backend.repository.*;
import ace.org.epms_backend.service.UnlockRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UnlockRequestServiceImpl implements UnlockRequestService {

    private final UnlockRequestRepository repo;
    private final AppraisalRepository appraisalRepo;

    @Override
    public void requestUnlock(Long appraisalId, String reason, Long managerId) {

        UnlockRequest req = UnlockRequest.builder()
                .appraisalId(appraisalId)
                .requestedBy(managerId)
                .reason(reason)
                .approved(null)
                .build();

        repo.save(req);
    }

    @Override
    public void approve(Long requestId) {

        UnlockRequest req = repo.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        Appraisal appraisal = appraisalRepo.findById(req.getAppraisalId())
                .orElseThrow(() -> new RuntimeException("Appraisal not found"));

        appraisal.setIsLocked(false);
        appraisalRepo.save(appraisal);

        req.setApproved(true);
        repo.save(req);
    }
}
