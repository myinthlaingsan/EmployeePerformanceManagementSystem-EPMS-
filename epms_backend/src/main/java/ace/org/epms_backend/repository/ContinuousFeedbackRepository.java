package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.continuous.ContinuousFeedback;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContinuousFeedbackRepository extends JpaRepository<ContinuousFeedback, Long> {
    
    @Query("SELECT f FROM ContinuousFeedback f WHERE f.employee.id = :employeeId " +
           "AND (f.manager.id = :currentUserId OR (f.status = 'PUBLISHED' AND f.employee.id = :currentUserId))")
    Page<ContinuousFeedback> findVisibleFeedbacksByEmployee(@Param("employeeId") Long employeeId, @Param("currentUserId") Long currentUserId, Pageable pageable);

    @Query("SELECT f FROM ContinuousFeedback f WHERE f.manager.id = :managerId " +
           "AND (:status IS NULL OR f.status = :status) " +
           "AND (f.manager.id = :currentUserId OR (f.status = 'PUBLISHED' AND f.employee.id = :currentUserId))")
    Page<ContinuousFeedback> findVisibleFeedbacksByManager(@Param("managerId") Long managerId, @Param("currentUserId") Long currentUserId, @Param("status") ace.org.epms_backend.enums.ContinuousStatus status, Pageable pageable);

    @Query("SELECT f FROM ContinuousFeedback f WHERE " +
           "(:status IS NULL OR f.status = :status) " +
           "AND (f.manager.id = :currentUserId OR (f.status = 'PUBLISHED' AND f.employee.id = :currentUserId))")
    Page<ContinuousFeedback> findAllVisibleFeedbacks(@Param("currentUserId") Long currentUserId, @Param("status") ace.org.epms_backend.enums.ContinuousStatus status, Pageable pageable);

    long countByEmployee_IdAndStatus(Long employeeId, ace.org.epms_backend.enums.ContinuousStatus status);
    long countByManager_IdAndStatus(Long managerId, ace.org.epms_backend.enums.ContinuousStatus status);
}
