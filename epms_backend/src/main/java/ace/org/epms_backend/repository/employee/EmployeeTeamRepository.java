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

    @org.springframework.data.jpa.repository.Query("SELECT et FROM EmployeeTeam et WHERE et.employee.id = :employeeId AND et.isPrimary = true")
    java.util.List<EmployeeTeam> findAllByEmployeeIdAndIsPrimaryTrue(Long employeeId);

//    default java.util.Optional<EmployeeTeam> findByEmployeeIdAndIsPrimaryTrue(Long employeeId) {
//        java.util.List<EmployeeTeam> list = findAllByEmployeeIdAndIsPrimaryTrue(employeeId);
//        return list.isEmpty() ? java.util.Optional.empty() : java.util.Optional.of(list.get(0));
//    }

    java.util.Optional<EmployeeTeam> findFirstByEmployeeIdAndIsPrimaryTrue(Long employeeId);
    Optional<EmployeeTeam> findByEmployeeIdAndIsPrimaryTrue(Long employeeId);
    void deleteByEmployeeIdAndTeamTeamId(Long employeeId, Long teamId);
}
