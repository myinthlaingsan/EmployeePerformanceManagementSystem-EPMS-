package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.employee.EmployeeDepartment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmployeeDepartmentRepository extends JpaRepository<EmployeeDepartment, Long> {
    @org.springframework.data.jpa.repository.Query("SELECT ed FROM EmployeeDepartment ed WHERE ed.employee.id = :employeeId AND ed.isCurrent = true")
    java.util.List<EmployeeDepartment> findAllByEmployeeIdAndIsCurrentTrue(Long employeeId);

    default java.util.Optional<EmployeeDepartment> findByEmployeeIdAndIsCurrentTrue(Long employeeId) {
        java.util.List<EmployeeDepartment> list = findAllByEmployeeIdAndIsCurrentTrue(employeeId);
        return list.isEmpty() ? java.util.Optional.empty() : java.util.Optional.of(list.get(0));
    }

    java.util.Optional<EmployeeDepartment> findFirstByEmployeeIdAndIsCurrentTrue(Long employeeId);
    java.util.List<EmployeeDepartment> findByCurrentDepartmentIdAndIsCurrentTrue(Long departmentId);
    boolean existsByCurrentDepartmentIdAndIsCurrentTrue(Long departmentId);
    java.util.List<EmployeeDepartment> findByEmployeeIdOrderByCreatedAtDesc(Long employeeId);
}
