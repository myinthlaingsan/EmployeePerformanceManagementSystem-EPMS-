package ace.org.epms_backend.repository.feedback360;

import ace.org.epms_backend.enums.FeedbackRelationship;
import ace.org.epms_backend.enums.FeedbackStatus;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.feedback360.FeedbackRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface FeedbackRequestRepository extends JpaRepository<FeedbackRequest, Long> {
    List<FeedbackRequest> findByEvaluatorIdAndStatus(Long evaluatorId, FeedbackStatus status);
    boolean existsByTargetUserIdAndEvaluatorIdAndCycleCycleId(Long targetUserId, Long evaluatorId, Long cycleId);
    List<FeedbackRequest> findByTargetUserIdAndCycleCycleId(Long targetUserId, Long cycleId);
    List<FeedbackRequest> findByCycleCycleId(Long cycleId);
    void deleteByTargetUserIdAndCycleCycleIdAndStatus(Long targetUserId, Long cycleId, FeedbackStatus status);

    // --- Evaluator Rotation Rule Queries ---

    /**
     * Returns the list of evaluators who evaluated the given target in the PREVIOUS cycle.
     * Used to filter out recently-used evaluators in the rotation rule.
     */
    @Query("""
            SELECT fr.evaluator FROM FeedbackRequest fr
            WHERE fr.targetUser.id = :targetId
              AND fr.cycle.cycleId = :cycleId
              AND fr.relationship = :relationship
            """)
    List<Employee> findEvaluatorsByTargetAndCycleAndRelationship(
            @Param("targetId") Long targetId,
            @Param("cycleId") Long cycleId,
            @Param("relationship") FeedbackRelationship relationship);

    /**
     * For the Round Robin fallback: returns evaluator history for a target ordered
     * by creation date ASC so the oldest (least recently assigned) evaluator comes first.
     */
    @Query("""
            SELECT fr FROM FeedbackRequest fr
            WHERE fr.targetUser.id = :targetId
              AND fr.relationship = :relationship
            ORDER BY fr.createdAt ASC
            """)
    List<FeedbackRequest> findAllByTargetOrderedByOldestFirst(
            @Param("targetId") Long targetId,
            @Param("relationship") FeedbackRelationship relationship);

    // --- Reminder and deadline queries ---

    @Query("""
            SELECT fr FROM FeedbackRequest fr
            WHERE fr.status IN ('PENDING', 'IN_PROGRESS')
              AND fr.dueDate IS NOT NULL
              AND fr.dueDate BETWEEN :now AND :cutoff
            """)
    List<FeedbackRequest> findPendingDueWithin(
            @Param("now") Instant now,
            @Param("cutoff") Instant cutoff);

    @Query("""
            SELECT fr FROM FeedbackRequest fr
            WHERE fr.status IN ('PENDING', 'IN_PROGRESS')
              AND fr.dueDate IS NOT NULL
              AND fr.dueDate < :cutoff
            """)
    List<FeedbackRequest> findOverdue(@Param("cutoff") Instant cutoff);
}