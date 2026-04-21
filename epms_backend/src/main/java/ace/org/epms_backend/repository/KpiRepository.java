package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.kpi.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public class KpiRepository {

    @PersistenceContext
    private EntityManager entityManager;

    // --- KPI Library ---
    @Transactional
    public <T> T save(T entity) {
        entityManager.persist(entity);
        return entity;
    }

    @Transactional
    public <T> T merge(T entity) {
        return entityManager.merge(entity);
    }

    public Optional<KpiLibrary> findLibraryById(Long id) {
        return Optional.ofNullable(entityManager.find(KpiLibrary.class, id));
    }

    public List<KpiLibrary> findAllActiveLibraries() {
        return entityManager.createQuery("SELECT l FROM KpiLibrary l WHERE l.isActive = true", KpiLibrary.class)
                .getResultList();
    }

    // --- KPI Goals ---
    public Optional<KpiGoals> findGoalsById(Long id) {
        return Optional.ofNullable(entityManager.find(KpiGoals.class, id));
    }

    public Optional<KpiGoals> findCurrentGoals(Long employeeId, Long cycleId) {
        TypedQuery<KpiGoals> query = entityManager.createQuery(
                "SELECT g FROM KpiGoals g WHERE g.employee.id = :empId AND g.appraisalCycleId = :cycleId AND g.isCurrent = true", 
                KpiGoals.class);
        query.setParameter("empId", employeeId);
        query.setParameter("cycleId", cycleId);
        return query.getResultList().stream().findFirst();
    }

    // --- KPI Goal Items ---
    public Optional<KpiGoalItem> findGoalItemById(Long id) {
        return Optional.ofNullable(entityManager.find(KpiGoalItem.class, id));
    }

    public List<KpiGoalItem> findActiveItemsByGoalSet(Long goalSetId) {
        TypedQuery<KpiGoalItem> query = entityManager.createQuery(
                "SELECT i FROM KpiGoalItem i WHERE i.goalSet.id = :goalSetId AND i.isActive = true", 
                KpiGoalItem.class);
        query.setParameter("goalSetId", goalSetId);
        return query.getResultList();
    }

    // --- KPI Progress ---
    public List<KpiProgress> findProgressByItemDesc(Long itemId) {
        TypedQuery<KpiProgress> query = entityManager.createQuery(
                "SELECT p FROM KpiProgress p WHERE p.goalItem.id = :itemId ORDER BY p.id DESC", 
                KpiProgress.class);
        query.setParameter("itemId", itemId);
        return query.getResultList();
    }

    // --- KPI Final Score ---
    public Optional<KpiFinalScore> findFinalScore(Long employeeId, Long cycleId) {
        TypedQuery<KpiFinalScore> query = entityManager.createQuery(
                "SELECT s FROM KpiFinalScore s WHERE s.employee.id = :empId AND s.cycleId = :cycleId", 
                KpiFinalScore.class);
        query.setParameter("empId", employeeId);
        query.setParameter("cycleId", cycleId);
        return query.getResultList().stream().findFirst();
    }
}
