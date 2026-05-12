package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.continuous.OneOnOneMeeting;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface OneOnOneMeetingRepository extends JpaRepository<OneOnOneMeeting, Long> {

       @Query("SELECT m FROM OneOnOneMeeting m WHERE m.employee.id = :employeeId " +
                     "AND (m.manager.id = :currentUserId OR (m.employee.id = :currentUserId AND (m.isPrivateNote = false OR m.isPrivateNote IS NULL)))")
       Page<OneOnOneMeeting> findVisibleMeetingsByEmployee(@Param("employeeId") Long employeeId,
                     @Param("currentUserId") Long currentUserId, Pageable pageable);

       @Query("SELECT m FROM OneOnOneMeeting m WHERE m.manager.id = :managerId " +
                     "AND (m.manager.id = :currentUserId OR (m.employee.id = :currentUserId AND (m.isPrivateNote = false OR m.isPrivateNote IS NULL)))")
       Page<OneOnOneMeeting> findVisibleMeetingsByManager(@Param("managerId") Long managerId,
                     @Param("currentUserId") Long currentUserId, Pageable pageable);

       @Query("SELECT m FROM OneOnOneMeeting m WHERE m.manager.id = :currentUserId OR (m.employee.id = :currentUserId AND (m.isPrivateNote = false OR m.isPrivateNote IS NULL))")
       Page<OneOnOneMeeting> findAllVisibleMeetings(@Param("currentUserId") Long currentUserId, Pageable pageable);

       Page<OneOnOneMeeting> findByEmployeeId(Long employeeId, Pageable pageable);

       Page<OneOnOneMeeting> findByManagerId(Long managerId, Pageable pageable);
}
