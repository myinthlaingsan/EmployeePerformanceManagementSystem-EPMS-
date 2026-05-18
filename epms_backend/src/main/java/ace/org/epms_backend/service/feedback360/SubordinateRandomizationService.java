package ace.org.epms_backend.service.feedback360;

import ace.org.epms_backend.model.employee.Employee;
import java.util.List;
import java.util.Set;

public interface SubordinateRandomizationService {
    List<Employee> selectSubordinates(Employee target, int maxSubordinates, Set<Long> excludedEvaluators);
}
