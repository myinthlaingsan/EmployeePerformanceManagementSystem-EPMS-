package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.employee.EmployeeRole;
import ace.org.epms_backend.model.employee.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface EmployeeRoleRepository extends JpaRepository<EmployeeRole, Long> {

    @Query("SELECT er.role FROM EmployeeRole er WHERE er.employee.id = :empId")
    List<Role> findRolesByEmployeeId(Long empId);
}
