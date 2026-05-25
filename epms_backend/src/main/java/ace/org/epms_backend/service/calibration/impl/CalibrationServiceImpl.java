package ace.org.epms_backend.service.calibration.impl;

import ace.org.epms_backend.dto.calibration.*;
import ace.org.epms_backend.enums.CalibrationSessionStatus;
import ace.org.epms_backend.enums.CalibrationStatus;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.model.appraisal.AppraisalCycle;
import ace.org.epms_backend.model.calibration.CalibrationSession;
import ace.org.epms_backend.model.calibration.CalibrationSessionSummary;
import ace.org.epms_backend.model.employee.Department;
import ace.org.epms_backend.model.feedback360.FeedbackSummary;
import ace.org.epms_backend.repository.AppraisalCycleRepository;
import ace.org.epms_backend.repository.DepartmentRepository;
import ace.org.epms_backend.repository.EmployeeDepartmentRepository;
import ace.org.epms_backend.repository.calibration.CalibrationSessionRepository;
import ace.org.epms_backend.repository.calibration.CalibrationSessionSummaryRepository;
import ace.org.epms_backend.repository.feedback360.FeedbackSummaryRepository;
import ace.org.epms_backend.service.calibration.CalibrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CalibrationServiceImpl implements CalibrationService {

    private final FeedbackSummaryRepository summaryRepository;
    private final CalibrationSessionRepository sessionRepository;
    private final CalibrationSessionSummaryRepository sessionSummaryRepository;
    private final AppraisalCycleRepository cycleRepository;
    private final DepartmentRepository departmentRepository;
    private final EmployeeDepartmentRepository employeeDepartmentRepository;

    // ── State machine ────────────────────────────────────────────────────────

    @Override
    @Transactional
    public void flagForReview(Long summaryId, Long actorId) {
        FeedbackSummary summary = getSummary(summaryId);
        assertNotLocked(summary);
        summary.setCalibrationStatus(CalibrationStatus.UNDER_REVIEW);
        summaryRepository.save(summary);
    }

    @Override
    @Transactional
    public void adjustScore(Long summaryId, AdjustScoreRequest req, Long actorId) {
        FeedbackSummary summary = getSummary(summaryId);
        assertNotLocked(summary);
        CalibrationStatus current = summary.getCalibrationStatus();
        if (current == null || current == CalibrationStatus.NOT_STARTED) {
            summary.setCalibrationStatus(CalibrationStatus.UNDER_REVIEW);
        }
        summary.setCalibratedFinalScore(req.getCalibratedFinalScore());
        summary.setCalibrationReason(req.getCalibrationReason());
        summary.setCalibrationDate(Instant.now());
        summary.setCalibratedBy(actorId);
        summary.setCalibrationStatus(CalibrationStatus.ADJUSTED);
        summaryRepository.save(summary);
    }

    @Override
    @Transactional
    public void approve(Long summaryId, String approverComment, Long actorId) {
        FeedbackSummary summary = getSummary(summaryId);
        assertNotLocked(summary);
        summary.setCalibrationStatus(CalibrationStatus.APPROVED);
        if (approverComment != null && !approverComment.isBlank()) {
            String existing = summary.getCalibrationReason();
            summary.setCalibrationReason(
                    (existing != null ? existing + " | Approved: " : "Approved: ") + approverComment);
        }
        summaryRepository.save(summary);
    }

    @Override
    @Transactional
    public void revert(Long summaryId, Long actorId) {
        FeedbackSummary summary = getSummary(summaryId);
        assertNotLocked(summary);
        summary.setCalibrationStatus(CalibrationStatus.UNDER_REVIEW);
        summaryRepository.save(summary);
    }

    // ── Session lifecycle ────────────────────────────────────────────────────

    @Override
    @Transactional
    public CalibrationSessionResponse createSession(CreateSessionRequest req, Long actorId) {
        AppraisalCycle cycle = cycleRepository.findById(req.getCycleId())
                .orElseThrow(() -> new NotFoundException("Cycle not found: " + req.getCycleId()));
        Department department = null;
        if (req.getDepartmentId() != null) {
            department = departmentRepository.findById(req.getDepartmentId())
                    .orElseThrow(() -> new NotFoundException("Department not found: " + req.getDepartmentId()));
        }
        CalibrationSession session = CalibrationSession.builder()
                .cycle(cycle)
                .department(department)
                .name(req.getName())
                .facilitator(req.getFacilitator())
                .scheduledAt(req.getScheduledAt())
                .notes(req.getNotes())
                .status(CalibrationSessionStatus.PLANNED)
                .build();
        session = sessionRepository.save(session);
        return toSessionResponse(session, Collections.emptyList());
    }

    @Override
    @Transactional
    public void addSummariesToSession(Long sessionId, List<Long> summaryIds) {
        CalibrationSession session = getSession(sessionId);
        for (Long summaryId : summaryIds) {
            FeedbackSummary summary = getSummary(summaryId);
            boolean exists = sessionSummaryRepository.findBySessionId(sessionId)
                    .stream().anyMatch(ss -> ss.getSummary().getId().equals(summaryId));
            if (!exists) {
                BigDecimal snapshot = summary.getCalibratedFinalScore() != null
                        ? summary.getCalibratedFinalScore()
                        : summary.getFinalScore();
                sessionSummaryRepository.save(
                        CalibrationSessionSummary.builder()
                                .session(session)
                                .summary(summary)
                                .scoreBeforeAdjustment(snapshot)
                                .build());
            }
        }
    }

    @Override
    @Transactional
    public void startSession(Long sessionId) {
        CalibrationSession session = getSession(sessionId);
        session.setStatus(CalibrationSessionStatus.IN_PROGRESS);
        sessionRepository.save(session);
    }

    @Override
    @Transactional
    public void completeSession(Long sessionId) {
        CalibrationSession session = getSession(sessionId);
        session.setStatus(CalibrationSessionStatus.COMPLETED);
        session.setCompletedAt(Instant.now());
        // Snapshot the final calibrated scores in the junction rows
        List<CalibrationSessionSummary> rows = sessionSummaryRepository.findBySessionId(sessionId);
        for (CalibrationSessionSummary row : rows) {
            row.setScoreAfterAdjustment(row.getSummary().getCalibratedFinalScore());
        }
        sessionSummaryRepository.saveAll(rows);
        sessionRepository.save(session);
    }

    @Override
    public List<CalibrationSessionResponse> listSessionsByCycle(Long cycleId) {
        return sessionRepository.findByCycleCycleId(cycleId).stream()
                .map(s -> {
                    List<Long> ids = sessionSummaryRepository.findBySessionId(s.getId())
                            .stream().map(ss -> ss.getSummary().getId()).collect(Collectors.toList());
                    return toSessionResponse(s, ids);
                }).collect(Collectors.toList());
    }

    // ── Reports ──────────────────────────────────────────────────────────────

    @Override
    public List<CalibrationDeltaRow> getCalibrationDeltas(Long cycleId) {
        return summaryRepository.findByCycleCycleId(cycleId).stream()
                .map(s -> {
                    String dept = employeeDepartmentRepository
                            .findFirstByEmployeeIdAndIsCurrentTrue(s.getEmployee().getId())
                            .map(ed -> ed.getCurrentDepartment() != null
                                    ? ed.getCurrentDepartment().getDepartmentName() : "N/A")
                            .orElse("N/A");
                    BigDecimal raw = s.getFinalScore();
                    BigDecimal cal = s.getCalibratedFinalScore();
                    BigDecimal delta = (raw != null && cal != null) ? cal.subtract(raw) : null;
                    return CalibrationDeltaRow.builder()
                            .summaryId(s.getId())
                            .employeeId(s.getEmployee().getId())
                            .employeeName(s.getEmployee().getStaffName())
                            .departmentName(dept)
                            .rawFinalScore(raw)
                            .calibratedFinalScore(cal)
                            .delta(delta)
                            .calibrationStatus(s.getCalibrationStatus())
                            .calibrationReason(s.getCalibrationReason())
                            .calibrationDate(s.getCalibrationDate())
                            .build();
                }).collect(Collectors.toList());
    }

    @Override
    public DistributionStats getScoreDistribution(Long cycleId, boolean useCalibrated) {
        List<FeedbackSummary> summaries = summaryRepository.findByCycleCycleId(cycleId);
        Map<String, Long> buckets = new LinkedHashMap<>();
        buckets.put("0-60", 0L);
        buckets.put("60-70", 0L);
        buckets.put("70-80", 0L);
        buckets.put("80-90", 0L);
        buckets.put("90-100", 0L);

        long calibratedCount = 0;
        double sum = 0;
        int count = 0;

        for (FeedbackSummary s : summaries) {
            BigDecimal raw = s.getFinalScore();
            BigDecimal cal = s.getCalibratedFinalScore();
            BigDecimal score = useCalibrated && cal != null ? cal : raw;
            if (score == null) continue;
            double v = score.doubleValue();
            sum += v;
            count++;
            if (cal != null) calibratedCount++;
            String bucket = v < 60 ? "0-60" : v < 70 ? "60-70" : v < 80 ? "70-80" : v < 90 ? "80-90" : "90-100";
            buckets.merge(bucket, 1L, Long::sum);
        }

        return DistributionStats.builder()
                .rawBuckets(buckets)
                .calibratedBuckets(buckets)
                .totalCount(summaries.size())
                .calibratedCount(calibratedCount)
                .rawAverage(count > 0 ? Math.round((sum / count) * 100.0) / 100.0 : 0.0)
                .calibratedAverage(count > 0 ? Math.round((sum / count) * 100.0) / 100.0 : 0.0)
                .build();
    }

    // ── Cycle freeze ─────────────────────────────────────────────────────────

    @Override
    @Transactional
    public void lockCycle(Long cycleId, Long actorId) {
        List<FeedbackSummary> summaries = summaryRepository.findByCycleCycleId(cycleId);
        Instant now = Instant.now();
        for (FeedbackSummary s : summaries) {
            CalibrationStatus status = s.getCalibrationStatus();
            if (status == CalibrationStatus.UNDER_REVIEW || status == CalibrationStatus.ADJUSTED) {
                throw new IllegalStateException(
                        "Cannot lock cycle: summary " + s.getId() + " for employee '"
                        + s.getEmployee().getStaffName() + "' is in " + status
                        + ". Approve or revert it first.");
            }
            s.setCalibrationStatus(CalibrationStatus.LOCKED);
            s.setIsFinalized(true);
            s.setFinalizedAt(now);
            s.setFinalizedBy(actorId);
        }
        summaryRepository.saveAll(summaries);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private FeedbackSummary getSummary(Long summaryId) {
        return summaryRepository.findById(summaryId)
                .orElseThrow(() -> new NotFoundException("Feedback summary not found: " + summaryId));
    }

    private CalibrationSession getSession(Long sessionId) {
        return sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NotFoundException("Calibration session not found: " + sessionId));
    }

    private void assertNotLocked(FeedbackSummary summary) {
        if (summary.getCalibrationStatus() == CalibrationStatus.LOCKED) {
            throw new IllegalStateException(
                    "Summary " + summary.getId() + " is LOCKED and cannot be modified.");
        }
    }

    private CalibrationSessionResponse toSessionResponse(CalibrationSession s, List<Long> summaryIds) {
        return CalibrationSessionResponse.builder()
                .id(s.getId())
                .cycleId(s.getCycle().getCycleId())
                .cycleName(s.getCycle().getCycleName())
                .departmentId(s.getDepartment() != null ? s.getDepartment().getId() : null)
                .departmentName(s.getDepartment() != null ? s.getDepartment().getDepartmentName() : null)
                .name(s.getName())
                .facilitator(s.getFacilitator())
                .scheduledAt(s.getScheduledAt())
                .completedAt(s.getCompletedAt())
                .status(s.getStatus())
                .notes(s.getNotes())
                .summaryIds(summaryIds)
                .build();
    }
}
