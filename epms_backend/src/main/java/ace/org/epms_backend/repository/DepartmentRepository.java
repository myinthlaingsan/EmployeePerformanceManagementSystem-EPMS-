package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.employee.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {
    boolean existsByDepartmentCodeAndIsActiveTrue(String departmentCode);
    List<Department> findByIsActiveTrue();
}
