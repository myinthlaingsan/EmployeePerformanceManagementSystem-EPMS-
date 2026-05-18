package ace.org.epms_backend.service.feedback360;

import ace.org.epms_backend.model.employee.Employee;
import java.util.List;
import java.util.Set;

public interface PeerRandomizationService {
    List<Employee> selectPeers(Employee target, int maxPeers, Set<Long> excludedEvaluators);
}
