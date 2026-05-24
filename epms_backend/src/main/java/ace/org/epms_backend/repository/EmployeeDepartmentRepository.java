package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.employee.EmployeeDepartment;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface EmployeeDepartmentRepository extends JpaRepository<EmployeeDepartment, Long> {
    @Query("SELECT ed FROM EmployeeDepartment ed WHERE ed.employee.id = :employeeId AND ed.isCurrent = true")
    List<EmployeeDepartment> findAllByEmployeeIdAndIsCurrentTrue(Long employeeId);

    default Optional<EmployeeDepartment> findByEmployeeIdAndIsCurrentTrue(Long employeeId) {
        List<EmployeeDepartment> list = findAllByEmployeeIdAndIsCurrentTrue(employeeId);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    Optional<EmployeeDepartment> findFirstByEmployeeIdAndIsCurrentTrue(Long employeeId);

    List<EmployeeDepartment> findByCurrentDepartmentIdAndIsCurrentTrue(Long departmentId);

    boolean existsByCurrentDepartmentIdAndIsCurrentTrue(Long departmentId);

    java.util.List<EmployeeDepartment> findByEmployeeIdOrderByCreatedAtDesc(Long employeeId);

    long countByCurrentDepartmentIdAndIsCurrentTrue(Long departmentId);
}
