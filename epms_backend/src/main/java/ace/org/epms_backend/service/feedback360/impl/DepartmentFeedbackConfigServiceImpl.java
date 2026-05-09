package ace.org.epms_backend.service.feedback360.impl;

import ace.org.epms_backend.dto.feedback360.DepartmentFeedbackConfigDTO;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.model.employee.Department;
import ace.org.epms_backend.model.feedback360.DepartmentFeedbackConfig;
import ace.org.epms_backend.repository.AppraisalCycleRepository; // actually need DepartmentRepository
import ace.org.epms_backend.repository.EmployeeDepartmentRepository; // actually need DepartmentRepository from core
import ace.org.epms_backend.repository.feedback360.DepartmentFeedbackConfigRepository;
import ace.org.epms_backend.service.feedback360.DepartmentFeedbackConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DepartmentFeedbackConfigServiceImpl implements DepartmentFeedbackConfigService {

    private final DepartmentFeedbackConfigRepository configRepository;
    private final ace.org.epms_backend.repository.DepartmentRepository departmentRepository;
    private final ace.org.epms_backend.repository.JobLevelRepository jobLevelRepository;

    @Override
    @Transactional
    public DepartmentFeedbackConfigDTO saveOrUpdate(DepartmentFeedbackConfigDTO dto) {
        ace.org.epms_backend.model.employee.Department department = departmentRepository.findById(dto.getDepartmentId())
                .orElseThrow(() -> new NotFoundException("Department not found: " + dto.getDepartmentId()));

        ace.org.epms_backend.model.employee.JobLevel jobLevel = jobLevelRepository.findById(dto.getLevelId())
                .orElseThrow(() -> new NotFoundException("Level not found: " + dto.getLevelId()));

        DepartmentFeedbackConfig config = configRepository.findByDepartmentIdAndJobLevelLevelId(dto.getDepartmentId(), dto.getLevelId())
                .orElse(new DepartmentFeedbackConfig());

        config.setDepartment(department);
        config.setJobLevel(jobLevel);
        config.setMinPeers(dto.getMinPeers());
        config.setMaxPeers(dto.getMaxPeers());
        config.setMinSubordinates(dto.getMinSubordinates());
        config.setMaxSubordinates(dto.getMaxSubordinates());
        config.setAllowCrossDepartment(dto.getAllowCrossDepartment() != null ? dto.getAllowCrossDepartment() : false);

        DepartmentFeedbackConfig saved = configRepository.save(config);
        return mapToDTO(saved);
    }

    @Override
    public List<DepartmentFeedbackConfigDTO> getAllConfigs() {
        return configRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<DepartmentFeedbackConfigDTO> getConfigByDepartmentId(Long departmentId) {
        return configRepository.findByDepartmentId(departmentId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteConfig(Long id) {
        configRepository.deleteById(id);
    }

    private DepartmentFeedbackConfigDTO mapToDTO(DepartmentFeedbackConfig entity) {
        return DepartmentFeedbackConfigDTO.builder()
                .departmentId(entity.getDepartment().getId())
                .departmentName(entity.getDepartment().getDepartmentName())
                .levelId(entity.getJobLevel().getLevelId())
                .levelName(entity.getJobLevel().getLevelName())
                .minPeers(entity.getMinPeers())
                .maxPeers(entity.getMaxPeers())
                .minSubordinates(entity.getMinSubordinates())
                .maxSubordinates(entity.getMaxSubordinates())
                .allowCrossDepartment(entity.getAllowCrossDepartment())
                .build();
    }
}
