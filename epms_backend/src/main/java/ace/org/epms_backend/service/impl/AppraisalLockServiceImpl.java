package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.notification.NotificationEvent;
import ace.org.epms_backend.enums.NotificationType;
import ace.org.epms_backend.enums.ReferenceType;
import ace.org.epms_backend.model.appraisal.*;
import ace.org.epms_backend.repository.*;
import ace.org.epms_backend.service.AppraisalLockService;

import lombok.RequiredArgsConstructor;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AppraisalLockServiceImpl implements AppraisalLockService {

    private final AppraisalRepository appraisalRepo;
    private final ApplicationEventPublisher eventPublisher;

    @Override

    @Scheduled(cron = "0 0 0 * * ?") // every midnight
    public void lockExpiredAppraisals() {

        List<Appraisal> list = appraisalRepo.findAll();

        for (Appraisal a : list) {
            if (a.getCycle().getEndDate().isBefore(LocalDate.now())) {
                a.setIsLocked(true);
                appraisalRepo.save(a);

                eventPublisher.publishEvent(NotificationEvent.builder()
                        .recipientId(a.getEmployee().getId())
                        .type(NotificationType.APPRAISAL_LOCKED)
                        .title("Appraisal Locked")
                        .message("Your appraisal for cycle " + a.getCycle().getCycleName()
                                + " has been automatically locked due to deadline.")
                        .referenceType(ReferenceType.APPRAISAL)
                        .referenceId(a.getAppraisalId())
                        .build());

            }
        }
    }
}
