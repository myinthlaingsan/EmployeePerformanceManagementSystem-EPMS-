package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.continuous.ContinuousFeedback;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ContinuousFeedbackRepository extends JpaRepository<ContinuousFeedback, Long> {

//    @Query("SELECT f FROM ContinuousFeedback f WHERE f.manager.id = :managerId " +
//            "AND (f.manager.id = :currentUserId OR (f.employee.id = :currentUserId AND (f.isPrivate = false OR f.isPrivate IS NULL)))")
//    Page<ContinuousFeedback> findVisibleFeedbacksByManager(@Param("managerId") Long managerId,
//                                                           @Param("currentUserId") Long currentUserId, Pageable pageable);

//    @Query("SELECT f FROM ContinuousFeedback f WHERE f.manager.id = :currentUserId OR (f.employee.id = :currentUserId AND (f.isPrivate = false OR f.isPrivate IS NULL))")
//    Page<ContinuousFeedback> findAllVisibleFeedbacks(@Param("currentUserId") Long currentUserId, Pageable pageable);

    Page<ContinuousFeedback> findByEmployee_Id(Long employeeId, Pageable pageable);

    Page<ContinuousFeedback> findByManager_Id(Long managerId, Pageable pageable);

    @Query("SELECT f FROM ContinuousFeedback f WHERE f.employee.id = :employeeId " +
            "AND (f.manager.id = :currentUserId OR (f.status = 'PUBLISHED' AND f.employee.id = :currentUserId)) " +
            "AND (:feedbackType IS NULL OR f.feedbackType = :feedbackType) " +
            "AND (:tagId IS NULL OR f.tag.tagId = :tagId) " +
            "AND (:createdAfter IS NULL OR f.createdAt >= :createdAfter) " +
            "AND (:createdBefore IS NULL OR f.createdAt <= :createdBefore)")
    Page<ContinuousFeedback> findVisibleFeedbacksByEmployee(
            @Param("employeeId") Long employeeId,
            @Param("currentUserId") Long currentUserId,
            @Param("feedbackType") ace.org.epms_backend.enums.FeedbackType feedbackType,
            @Param("tagId") Long tagId,
            @Param("createdAfter") java.time.Instant createdAfter,
            @Param("createdBefore") java.time.Instant createdBefore,
            Pageable pageable);

    @Query("SELECT f FROM ContinuousFeedback f WHERE f.manager.id = :managerId " +
            "AND (:status IS NULL OR f.status = :status) " +
            "AND (f.manager.id = :currentUserId OR (f.status = 'PUBLISHED' AND f.employee.id = :currentUserId)) " +
            "AND (:feedbackType IS NULL OR f.feedbackType = :feedbackType) " +
            "AND (:tagId IS NULL OR f.tag.tagId = :tagId) " +
            "AND (:createdAfter IS NULL OR f.createdAt >= :createdAfter) " +
            "AND (:createdBefore IS NULL OR f.createdAt <= :createdBefore)")
    Page<ContinuousFeedback> findVisibleFeedbacksByManager(
            @Param("managerId") Long managerId,
            @Param("currentUserId") Long currentUserId,
            @Param("status") ace.org.epms_backend.enums.ContinuousStatus status,
            @Param("feedbackType") ace.org.epms_backend.enums.FeedbackType feedbackType,
            @Param("tagId") Long tagId,
            @Param("createdAfter") java.time.Instant createdAfter,
            @Param("createdBefore") java.time.Instant createdBefore,
            Pageable pageable);

    @Query("SELECT f FROM ContinuousFeedback f WHERE " +
            "(:status IS NULL OR f.status = :status) " +
            "AND (f.manager.id = :currentUserId OR (f.status = 'PUBLISHED' AND f.employee.id = :currentUserId)) " +
            "AND (:feedbackType IS NULL OR f.feedbackType = :feedbackType) " +
            "AND (:tagId IS NULL OR f.tag.tagId = :tagId) " +
            "AND (:createdAfter IS NULL OR f.createdAt >= :createdAfter) " +
            "AND (:createdBefore IS NULL OR f.createdAt <= :createdBefore)")
    Page<ContinuousFeedback> findAllVisibleFeedbacks(
            @Param("currentUserId") Long currentUserId,
            @Param("status") ace.org.epms_backend.enums.ContinuousStatus status,
            @Param("feedbackType") ace.org.epms_backend.enums.FeedbackType feedbackType,
            @Param("tagId") Long tagId,
            @Param("createdAfter") java.time.Instant createdAfter,
            @Param("createdBefore") java.time.Instant createdBefore,
            Pageable pageable);

    @Query("SELECT f FROM ContinuousFeedback f WHERE " +
            "(:status IS NULL OR f.status = :status) " +
            "AND (f.manager.id = :currentUserId " +
            "  OR f.manager.id IN :subordinateManagerIds " +
            "  OR (f.status = 'PUBLISHED' AND f.employee.id = :currentUserId))")
    Page<ContinuousFeedback> findAllVisibleFeedbacksWithChain(
            @Param("currentUserId") Long currentUserId,
            @Param("subordinateManagerIds") java.util.Set<Long> subordinateManagerIds,
            @Param("status") ace.org.epms_backend.enums.ContinuousStatus status,
            Pageable pageable);

    @Query("SELECT f FROM ContinuousFeedback f WHERE f.employee.id = :employeeId " +
            "AND (f.manager.id = :currentUserId " +
            "  OR f.manager.id IN :subordinateManagerIds " +
            "  OR (f.status = 'PUBLISHED' AND f.employee.id = :currentUserId)) " +
            "AND (:feedbackType IS NULL OR f.feedbackType = :feedbackType) " +
            "AND (:tagId IS NULL OR f.tag.tagId = :tagId) " +
            "AND (:createdAfter IS NULL OR f.createdAt >= :createdAfter) " +
            "AND (:createdBefore IS NULL OR f.createdAt <= :createdBefore)")
    Page<ContinuousFeedback> findVisibleFeedbacksByEmployeeWithChain(
            @Param("employeeId") Long employeeId,
            @Param("currentUserId") Long currentUserId,
            @Param("subordinateManagerIds") java.util.Set<Long> subordinateManagerIds,
            @Param("feedbackType") ace.org.epms_backend.enums.FeedbackType feedbackType,
            @Param("tagId") Long tagId,
            @Param("createdAfter") java.time.Instant createdAfter,
            @Param("createdBefore") java.time.Instant createdBefore,
            Pageable pageable);

    long countByEmployee_IdAndStatus(Long employeeId, ace.org.epms_backend.enums.ContinuousStatus status);

    long countByManager_IdAndStatus(Long managerId, ace.org.epms_backend.enums.ContinuousStatus status);
}
