package ace.org.epms_backend.repository;

import ace.org.epms_backend.enums.SourceType;
import ace.org.epms_backend.model.continuous.PerformanceHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PerformanceHistoryRepository extends JpaRepository<PerformanceHistory, Long> {
    @Query("SELECT h FROM PerformanceHistory h WHERE " +
           "(h.employee.id = :id OR h.manager.id = :id OR h.performer.id = :id OR h.createdBy = :id) " +
           "AND (:sourceType IS NULL OR h.sourceType = :sourceType)")
    Page<PerformanceHistory> findByEmployeeAndOptionalSource(@Param("id") Long id, @Param("sourceType") SourceType sourceType, Pageable pageable);

    @Query("SELECT h FROM PerformanceHistory h WHERE (:sourceType IS NULL OR h.sourceType = :sourceType)")
    Page<PerformanceHistory> findAllByOptionalSource(@Param("sourceType") SourceType sourceType, Pageable pageable);

    Page<PerformanceHistory> findBySourceTypeAndSourceId(SourceType sourceType, Long sourceId, Pageable pageable);
}
