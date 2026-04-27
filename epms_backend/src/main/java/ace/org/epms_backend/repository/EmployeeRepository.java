package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.employee.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    boolean existsByEmail(String email);

    @Query("SELECT e FROM Employee e JOIN FETCH e.position p JOIN FETCH p.level WHERE e.email = :email")
    Optional<Employee> findByEmail(String email);

    @Query("SELECT e FROM Employee e JOIN FETCH e.position p JOIN FETCH p.level")
    List<Employee> findAll();

    @Query("SELECT e FROM Employee e JOIN FETCH e.position p JOIN FETCH p.level WHERE e.id = :id")
    Optional<Employee> findById(Long id);

    boolean existsByLevel(ace.org.epms_backend.model.employee.JobLevel level);

    boolean existsByPosition(ace.org.epms_backend.model.employee.Position position);

    //add by tms for 360
    // Find employees who share the same direct manager (Peers)
    List<Employee> findByDirectManagerAndIdNot(Employee directManager, Long id);

    // Find employees who report to the current employee (Subordinates)
    List<Employee> findByDirectManager(Employee directManager);
    //line end(for 360)
}
