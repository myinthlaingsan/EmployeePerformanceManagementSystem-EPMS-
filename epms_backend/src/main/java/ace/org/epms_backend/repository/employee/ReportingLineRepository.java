package ace.org.epms_backend.repository.employee;

import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.employee.ReportingLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReportingLineRepository extends JpaRepository<ReportingLine, Long> {
    // Find active manager for an employee
    Optional<ReportingLine> findByEmployeeAndIsActiveTrue(Employee employee);
    
    // Find all active subordinates for a manager
    List<ReportingLine> findAllByManagerAndIsActiveTrue(Employee manager);
}
