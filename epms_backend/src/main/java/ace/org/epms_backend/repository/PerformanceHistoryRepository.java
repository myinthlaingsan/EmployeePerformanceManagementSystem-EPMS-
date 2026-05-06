package ace.org.epms_backend.repository;

import ace.org.epms_backend.enums.SourceType;
import ace.org.epms_backend.model.continuous.PerformanceHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PerformanceHistoryRepository extends JpaRepository<PerformanceHistory, Long> {
    List<PerformanceHistory> findByEmployee_IdOrManager_IdOrPerformer_IdOrCreatedBy(Long employeeId, Long managerId, Long performerId, Long createdBy);
    List<PerformanceHistory> findBySourceTypeAndSourceId(SourceType sourceType, Long sourceId);
    List<PerformanceHistory> findAllByOrderByCreatedAtDesc();
}
