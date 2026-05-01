package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.model.appraisal.*;
import ace.org.epms_backend.repository.*;
import ace.org.epms_backend.service.AppraisalLockService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AppraisalLockServiceImpl implements AppraisalLockService {

    private final AppraisalRepository appraisalRepo;

    @Override
    @Scheduled(cron = "0 0 0 * * ?") // every midnight
    public void lockExpiredAppraisals() {

        List<Appraisal> list = appraisalRepo.findAll();

        for (Appraisal a : list) {
            if (a.getCycle().getEndDate().isBefore(LocalDate.now())) {
                a.setIsLocked(true);
                appraisalRepo.save(a);
            }
        }
    }
}
