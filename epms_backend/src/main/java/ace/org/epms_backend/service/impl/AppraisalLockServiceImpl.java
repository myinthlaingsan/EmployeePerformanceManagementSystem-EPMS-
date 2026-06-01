package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.notification.NotificationEvent;
import ace.org.epms_backend.dto.AuditRequest;
import ace.org.epms_backend.enums.AuditAction;
import ace.org.epms_backend.enums.AuditStatus;
import ace.org.epms_backend.enums.NotificationType;
import ace.org.epms_backend.enums.ReferenceType;
import ace.org.epms_backend.model.appraisal.*;
import ace.org.epms_backend.repository.*;
import ace.org.epms_backend.service.AppraisalLockService;
import ace.org.epms_backend.service.AuditService;

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
    private final AuditService auditService;

    @Override

    @Scheduled(cron = "0 0 0 * * ?") // every midnight
    public void lockExpiredAppraisals() {

        List<Appraisal> list = appraisalRepo.findAll();

        for (Appraisal a : list) {
            if (!Boolean.TRUE.equals(a.getIsLocked()) && a.getCycle().getEndDate().isBefore(LocalDate.now())) {
                a.setIsLocked(true);
                a.setLockedAt(java.time.Instant.now());
                appraisalRepo.save(a);

                auditService.log(AuditRequest.builder()
                        .tableName("appraisals")
                        .recordId(a.getAppraisalId())
                        .action(AuditAction.UPDATE)
                        .newState(java.util.Map.of(
                                "appraisalId", a.getAppraisalId(),
                                "cycleId", a.getCycle().getCycleId(),
                                "isLocked", a.getIsLocked(),
                                "lockedAt", a.getLockedAt()))
                        .status(AuditStatus.SUCCESS)
                        .build());

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
