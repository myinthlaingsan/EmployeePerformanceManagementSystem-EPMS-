package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.continuous.OneOnOneMeeting;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OneOnOneMeetingRepository extends JpaRepository<OneOnOneMeeting, Long> {

    @Query("SELECT m FROM OneOnOneMeeting m WHERE m.employee.id = :employeeId " +
           "AND (m.manager.id = :currentUserId OR (m.status = 'PUBLISHED' AND m.employee.id = :currentUserId))")
    Page<OneOnOneMeeting> findVisibleMeetingsByEmployee(@Param("employeeId") Long employeeId, @Param("currentUserId") Long currentUserId, Pageable pageable);

    @Query("SELECT m FROM OneOnOneMeeting m WHERE m.manager.id = :managerId " +
           "AND (:status IS NULL OR m.status = :status) " +
           "AND (m.manager.id = :currentUserId OR (m.status = 'PUBLISHED' AND m.employee.id = :currentUserId))")
    Page<OneOnOneMeeting> findVisibleMeetingsByManager(@Param("managerId") Long managerId, @Param("currentUserId") Long currentUserId, @Param("status") ace.org.epms_backend.enums.ContinuousStatus status, Pageable pageable);

    @Query("SELECT m FROM OneOnOneMeeting m WHERE " +
           "(:status IS NULL OR m.status = :status) " +
           "AND (m.manager.id = :currentUserId OR (m.status = 'PUBLISHED' AND m.employee.id = :currentUserId))")
    Page<OneOnOneMeeting> findAllVisibleMeetings(@Param("currentUserId") Long currentUserId, @Param("status") ace.org.epms_backend.enums.ContinuousStatus status, Pageable pageable);

    long countByEmployee_IdAndStatus(Long employeeId, ace.org.epms_backend.enums.ContinuousStatus status);
    long countByManager_IdAndStatus(Long managerId, ace.org.epms_backend.enums.ContinuousStatus status);
}
