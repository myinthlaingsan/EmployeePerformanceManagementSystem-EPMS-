package ace.org.epms_backend.service.feedback360;

import ace.org.epms_backend.dto.feedback360.DepartmentFeedbackConfigDTO;
import java.util.List;

public interface DepartmentFeedbackConfigService {
    DepartmentFeedbackConfigDTO saveOrUpdate(DepartmentFeedbackConfigDTO dto);
    List<DepartmentFeedbackConfigDTO> getAllConfigs();
    List<DepartmentFeedbackConfigDTO> getConfigByDepartmentId(Long departmentId);
    void deleteConfig(Long id);
}
