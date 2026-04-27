package ace.org.epms_backend.repository.employee;

import ace.org.epms_backend.model.employee.EmployeeTeam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeTeamRepository extends JpaRepository<EmployeeTeam, Long> {
    List<EmployeeTeam> findByTeamTeamId(Long teamId);
    List<EmployeeTeam> findByEmployeeId(Long employeeId);
    Optional<EmployeeTeam> findByEmployeeIdAndTeamTeamId(Long employeeId, Long teamId);
    Optional<EmployeeTeam> findByEmployeeIdAndIsPrimaryTrue(Long employeeId);
}
