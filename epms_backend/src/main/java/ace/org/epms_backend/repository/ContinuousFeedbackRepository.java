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
           "AND (f.manager.id = :currentUserId OR (f.employee.id = :currentUserId AND (f.isPrivate = false OR f.isPrivate IS NULL)))")
    Page<ContinuousFeedback> findVisibleFeedbacksByEmployee(@Param("employeeId") Long employeeId, @Param("currentUserId") Long currentUserId, Pageable pageable);

    @Query("SELECT f FROM ContinuousFeedback f WHERE f.manager.id = :managerId " +
           "AND (f.manager.id = :currentUserId OR (f.employee.id = :currentUserId AND (f.isPrivate = false OR f.isPrivate IS NULL)))")
    Page<ContinuousFeedback> findVisibleFeedbacksByManager(@Param("managerId") Long managerId, @Param("currentUserId") Long currentUserId, Pageable pageable);

    @Query("SELECT f FROM ContinuousFeedback f WHERE f.manager.id = :currentUserId OR (f.employee.id = :currentUserId AND (f.isPrivate = false OR f.isPrivate IS NULL))")
    Page<ContinuousFeedback> findAllVisibleFeedbacks(@Param("currentUserId") Long currentUserId, Pageable pageable);

    Page<ContinuousFeedback> findByEmployee_Id(Long employeeId, Pageable pageable);
    Page<ContinuousFeedback> findByManager_Id(Long managerId, Pageable pageable);
}
