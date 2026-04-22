package ace.org.epms_backend.repository;

import ace.org.epms_backend.enums.SourceType;
import ace.org.epms_backend.model.continuous.PerformanceHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PerformanceHistoryRepository extends JpaRepository<PerformanceHistory, Long> {
    List<PerformanceHistory> findByEmployee_Id(Long employeeId);
    List<PerformanceHistory> findByEmployee_IdAndSourceType(Long employeeId, SourceType sourceType);
    List<PerformanceHistory> findBySourceTypeAndSourceId(SourceType sourceType, Long sourceId);
}
