package ace.org.epms_backend.service.calibration;

import ace.org.epms_backend.dto.calibration.*;

import java.util.List;

public interface CalibrationService {

    // ── Per-summary state machine ────────────────────────────────────────────
    void flagForReview(Long summaryId, Long actorId);
    void adjustScore(Long summaryId, AdjustScoreRequest req, Long actorId);
    void approve(Long summaryId, String approverComment, Long actorId);
    void revert(Long summaryId, Long actorId);

    // ── Session lifecycle ────────────────────────────────────────────────────
    CalibrationSessionResponse createSession(CreateSessionRequest req, Long actorId);
    void addSummariesToSession(Long sessionId, List<Long> summaryIds);
    void startSession(Long sessionId);
    void completeSession(Long sessionId);
    List<CalibrationSessionResponse> listSessionsByCycle(Long cycleId);

    // ── Reports ──────────────────────────────────────────────────────────────
    List<CalibrationDeltaRow> getCalibrationDeltas(Long cycleId);
    DistributionStats getScoreDistribution(Long cycleId, boolean calibrated);

    // ── Cycle freeze ─────────────────────────────────────────────────────────
    void lockCycle(Long cycleId, Long actorId);
}
