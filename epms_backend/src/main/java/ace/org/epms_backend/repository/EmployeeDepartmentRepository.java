package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.employee.EmployeeDepartment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmployeeDepartmentRepository extends JpaRepository<EmployeeDepartment, Long> {
    Optional<EmployeeDepartment> findByEmployeeIdAndIsCurrentTrue(Long employeeId);
    boolean existsByCurrentDepartmentIdAndIsCurrentTrue(Long departmentId);
    java.util.List<EmployeeDepartment> findByEmployeeIdOrderByCreatedAtDesc(Long employeeId);
}
