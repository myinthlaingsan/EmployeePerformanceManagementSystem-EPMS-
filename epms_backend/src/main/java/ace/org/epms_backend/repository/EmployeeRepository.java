package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.employee.Employee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee,Long> {
    boolean existsByEmail(String email);
    Optional<Employee> findByEmail(String email);
    boolean existsByLevel(ace.org.epms_backend.model.employee.JobLevel level);
    boolean existsByPosition(ace.org.epms_backend.model.employee.Position position);

    //add by tms for 360
    // Find employees who share the same direct manager (Peers)
    List<Employee> findByDirectManagerAndIdNot(Employee directManager, Long id);

    // Find employees who report to the current employee (Subordinates)
    List<Employee> findByDirectManager(Employee directManager);
    //line end(for 360)
}
