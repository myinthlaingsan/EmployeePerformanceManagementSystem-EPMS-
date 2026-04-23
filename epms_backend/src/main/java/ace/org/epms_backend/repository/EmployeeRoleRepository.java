package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.employee.EmployeeRole;
import ace.org.epms_backend.model.employee.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import ace.org.epms_backend.model.employee.EmployeeRoleId;

import java.util.List;

@Repository
public interface EmployeeRoleRepository extends JpaRepository<EmployeeRole, EmployeeRoleId> {

    @Query("SELECT er.role FROM EmployeeRole er WHERE er.employee.id = :empId")
    List<Role> findRolesByEmployeeId(Long empId);

    @Query("SELECT er.employee FROM EmployeeRole er WHERE er.role.roleId = :roleId")
    List<ace.org.epms_backend.model.employee.Employee> findEmployeesByRoleId(Long roleId);

    boolean existsByEmployee_IdAndRole_RoleId(Long employeeId, Long roleId);

    void deleteByEmployee_IdAndRole_RoleId(Long employeeId, Long roleId);

    boolean existsByRole(Role role);
}
