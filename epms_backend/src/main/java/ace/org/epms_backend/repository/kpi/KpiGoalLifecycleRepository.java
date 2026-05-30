package ace.org.epms_backend.repository.kpi;

import ace.org.epms_backend.enums.CycleStatus;
import ace.org.epms_backend.model.appraisal.AppraisalCycle;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public class KpiGoalLifecycleRepository {

    @PersistenceContext
    private EntityManager entityManager;

    public List<AppraisalCycle> findCyclesDueForLock(LocalDate today) {
        return entityManager.createQuery("""
                        SELECT c FROM AppraisalCycle c
                        WHERE c.managerEvaluationDeadline IS NOT NULL
                        AND c.managerEvaluationDeadline <= :today
                        AND c.isActive = true
                        AND (c.status IS NULL OR c.status IN :statuses)
                        ORDER BY c.managerEvaluationDeadline ASC, c.cycleId ASC
                        """, AppraisalCycle.class)
                .setParameter("today", today)
                .setParameter("statuses", List.of(CycleStatus.IN_PROGRESS, CycleStatus.EVALUATION))
                .getResultList();
    }

    public List<AppraisalCycle> findCyclesDueForArchive(LocalDate today) {
        return entityManager.createQuery("""
                        SELECT c FROM AppraisalCycle c
                        WHERE c.finalizationDeadline IS NOT NULL
                        AND c.finalizationDeadline <= :today
                        AND c.isActive = true
                        AND (c.status IS NULL OR c.status IN :statuses)
                        ORDER BY c.finalizationDeadline ASC, c.cycleId ASC
                        """, AppraisalCycle.class)
                .setParameter("today", today)
                .setParameter("statuses", List.of(CycleStatus.IN_PROGRESS, CycleStatus.EVALUATION))
                .getResultList();
    }

    public int lockNonArchivedGoalsByCycleId(Long cycleId) {
        return entityManager.createQuery("""
                        UPDATE KpiGoals g
                        SET g.status = ace.org.epms_backend.enums.KpiGoalStatus.LOCKED
                        WHERE g.cycle.cycleId = :cycleId
                        AND (g.status IS NULL OR g.status <> ace.org.epms_backend.enums.KpiGoalStatus.ARCHIVED)
                        """)
                .setParameter("cycleId", cycleId)
                .executeUpdate();
    }

    public int archiveLockedGoalsByCycleId(Long cycleId) {
        return entityManager.createQuery("""
                        UPDATE KpiGoals g
                        SET g.status = ace.org.epms_backend.enums.KpiGoalStatus.ARCHIVED,
                        g.isCurrent = false
                        WHERE g.cycle.cycleId = :cycleId
                        AND g.status = ace.org.epms_backend.enums.KpiGoalStatus.LOCKED
                        """)
                .setParameter("cycleId", cycleId)
                .executeUpdate();
    }
}
