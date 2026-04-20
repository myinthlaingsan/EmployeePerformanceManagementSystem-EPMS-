package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.enums.AppraisalStatus;
import ace.org.epms_backend.model.appraisal.Appraisal;
import ace.org.epms_backend.repository.AppraisalRepository;
import ace.org.epms_backend.service.AppraisalService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AppraisalServiceImpl implements AppraisalService {

    private final AppraisalRepository appraisalRepo;

    @Override
    public void finalizeAppraisal(Long appraisalId) {

        Appraisal appraisal = appraisalRepo.findById(appraisalId)
                .orElseThrow(() -> new RuntimeException("Appraisal not found"));

        appraisal.setStatus(AppraisalStatus.ARCHIVED);
        appraisal.setIsLocked(true);

        appraisalRepo.save(appraisal);
    }
}
