package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.continuous.OneOnOneMeeting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OneOnOneMeetingRepository extends JpaRepository<OneOnOneMeeting, Long> {
    List<OneOnOneMeeting> findByEmployeeId(Long employeeId);
    List<OneOnOneMeeting> findByManagerId(Long managerId);
}
