package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.employee.Employee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee,Long> {
    boolean existsByEmail(String email);
    Optional<Employee> findByEmail(String email);
    boolean existsByLevel(ace.org.epms_backend.model.employee.JobLevel level);
    boolean existsByPosition(ace.org.epms_backend.model.employee.Position position);
}
