package ace.org.epms_backend.service.feedback360;

import ace.org.epms_backend.model.employee.Employee;
import java.util.Optional;

public interface ManagerAssignmentService {
    Optional<Employee> getDirectManager(Employee target);
}
