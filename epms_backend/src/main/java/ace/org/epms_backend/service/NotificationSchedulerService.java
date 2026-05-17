package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.notification.NotificationEvent;
import ace.org.epms_backend.enums.AppraisalStatus;
import ace.org.epms_backend.enums.CycleStatus;
import ace.org.epms_backend.enums.NotificationType;
import ace.org.epms_backend.enums.ReferenceType;
import ace.org.epms_backend.model.appraisal.Appraisal;
import ace.org.epms_backend.model.appraisal.AppraisalCycle;
import ace.org.epms_backend.repository.AppraisalCycleRepository;
import ace.org.epms_backend.repository.AppraisalRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationSchedulerService {

    private final AppraisalCycleRepository cycleRepository;
    private final AppraisalRepository appraisalRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final AppraisalCycleService cycleService;

    // ─────────────────────────────────────────────────────────────────
    // Daily at 00:05 AM — drive all cycle phase transitions
    // ─────────────────────────────────────────────────────────────────
    @Scheduled(cron = "0 5 0 * * *")
    @Transactional
    public void processCyclePhaseTransitions() {
        LocalDate today = LocalDate.now();
        log.info("[Scheduler] Running cycle phase transitions for {}", today);

        // 1. PLANNING → IN_PROGRESS  (when startDate is reached)
        List<AppraisalCycle> readyToStart = cycleRepository
                .findCyclesReadyForInProgress(CycleStatus.PLANNING, today);
        for (AppraisalCycle cycle : readyToStart) {
            log.info("[Scheduler] Transitioning cycle {} to IN_PROGRESS", cycle.getCycleId());
            cycle.setStatus(CycleStatus.IN_PROGRESS);
            cycleRepository.save(cycle);

            eventPublisher.publishEvent(NotificationEvent.builder()
                    .broadcast(true)
                    .type(NotificationType.CYCLE_PHASE_STARTED)
                    .title("Self-Assessment Phase Open")
                    .message("The self-assessment phase for appraisal cycle '"
                            + cycle.getCycleName() + "' is now open. Please complete your self-assessment.")
                    .referenceType(ReferenceType.APPRAISAL)
                    .referenceId(cycle.getCycleId())
                    .actionUrl("/appraisals/my-appraisals")
                    .build());
        }

        // 2. IN_PROGRESS → EVALUATION  (when selfAssessmentDeadline is reached)
        List<AppraisalCycle> readyForEval = cycleRepository
                .findCyclesReadyForEvaluation(CycleStatus.IN_PROGRESS, today);
        for (AppraisalCycle cycle : readyForEval) {
            log.info("[Scheduler] Transitioning cycle {} to EVALUATION", cycle.getCycleId());
            cycle.setStatus(CycleStatus.EVALUATION);
            cycleRepository.save(cycle);

            eventPublisher.publishEvent(NotificationEvent.builder()
                    .broadcast(true)
                    .type(NotificationType.CYCLE_PHASE_STARTED)
                    .title("Manager Evaluation Phase Open")
                    .message("The manager evaluation phase for appraisal cycle '"
                            + cycle.getCycleName() + "' is now open.")
                    .referenceType(ReferenceType.APPRAISAL)
                    .referenceId(cycle.getCycleId())
                    .actionUrl("/appraisals")
                    .build());
        }

        // 3. Auto-close cycles where endDate has passed
        List<AppraisalCycle> dueForClosure = cycleRepository.findCyclesDueForClosure(today);
        for (AppraisalCycle cycle : dueForClosure) {
            log.info("[Scheduler] Auto-closing cycle {} (endDate={})", cycle.getCycleId(), cycle.getEndDate());
            cycleService.schedulerDrivenClose(cycle.getCycleId());
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // Daily at 9:00 AM — 2-day closing warning
    // Warns employees and managers 2 days before endDate
    // ─────────────────────────────────────────────────────────────────
    @Scheduled(cron = "0 0 9 * * *")
    public void sendClosingWarnings() {
        LocalDate twoDaysFromNow = LocalDate.now().plusDays(2);
        log.info("[Scheduler] Checking for cycles closing on {}", twoDaysFromNow);

        List<AppraisalCycle> closingSoon = cycleRepository.findCyclesClosingOn(twoDaysFromNow);

        for (AppraisalCycle cycle : closingSoon) {
            // Warn employees who have NOT submitted self-assessment
            List<Appraisal> pendingSelf = appraisalRepository.findByCycleIdAndStatusNotIn(
                    cycle.getCycleId(),
                    List.of(AppraisalStatus.SELF_ASSESSED, AppraisalStatus.EVALUATED,
                            AppraisalStatus.HR_APPROVED, AppraisalStatus.FINALIZED,
                            AppraisalStatus.ARCHIVED));

            for (Appraisal appraisal : pendingSelf) {
                eventPublisher.publishEvent(NotificationEvent.builder()
                        .recipientId(appraisal.getEmployee().getId())
                        .type(NotificationType.CYCLE_CLOSING_SOON_EMPLOYEE)
                        .title("⚠️ Appraisal Closing in 2 Days")
                        .message("Your appraisal for cycle '" + cycle.getCycleName()
                                + "' closes in 2 days. Please complete your self-assessment before it closes.")
                        .referenceType(ReferenceType.APPRAISAL)
                        .referenceId(appraisal.getAppraisalId())
                        .actionUrl("/appraisals/self-assessment/" + appraisal.getAppraisalId())
                        .build());
            }

            // Warn managers who have NOT submitted their evaluation
            List<Appraisal> pendingEval = appraisalRepository.findByCycle_CycleIdAndStatus(
                    cycle.getCycleId(), AppraisalStatus.SELF_ASSESSED);

            for (Appraisal appraisal : pendingEval) {
                if (appraisal.getManager() == null) continue;
                eventPublisher.publishEvent(NotificationEvent.builder()
                        .recipientId(appraisal.getManager().getId())
                        .type(NotificationType.CYCLE_CLOSING_SOON_MANAGER)
                        .title("⚠️ Evaluation Closing in 2 Days")
                        .message("Your evaluation for " + appraisal.getEmployee().getStaffName()
                                + " in cycle '" + cycle.getCycleName()
                                + "' closes in 2 days. Please complete the evaluation.")
                        .referenceType(ReferenceType.APPRAISAL)
                        .referenceId(appraisal.getAppraisalId())
                        .actionUrl("/appraisals/manager-evaluation/" + appraisal.getAppraisalId())
                        .build());
            }
        }
    }
}
