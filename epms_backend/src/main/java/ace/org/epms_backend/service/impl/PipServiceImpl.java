package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.pip.PipCreateRequest;
import ace.org.epms_backend.dto.pip.PipResponse;
import ace.org.epms_backend.enums.PipStatus;
import ace.org.epms_backend.exception.UserNotFoundException;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.pip.PipRecord;
import ace.org.epms_backend.repository.EmployeeRepository;
import ace.org.epms_backend.repository.PipRecordRepository;
import ace.org.epms_backend.service.PipService;
import ace.org.epms_backend.mapper.PipMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PipServiceImpl implements PipService {

    private final PipRecordRepository pipRecordRepository;
    private final EmployeeRepository employeeRepository;
    private final PipMapper pipMapper;

    @Override
    public PipResponse createPip(PipCreateRequest request) {

        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new UserNotFoundException("Employee not found"));

        Employee manager = employeeRepository.findById(request.getManagerId())
                .orElseThrow(() -> new UserNotFoundException("Manager not found"));

        PipRecord pip = pipMapper.toEntity(request);

        pip.setEmployee(employee);
        pip.setManager(manager);
        pip.setStatus(PipStatus.DRAFT);

        pip = pipRecordRepository.save(pip);

        return pipMapper.toResponse(pip);
    }

    @Override
    public PipResponse getPipById(Long id) {

        PipRecord pip = pipRecordRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("PIP not found"));

        return pipMapper.toResponse(pip);
    }

    @Override
    public List<PipResponse> getAllPips() {

        return pipRecordRepository.findAll()
                .stream()
                .map(pipMapper::toResponse)
                .toList();
    }

    @Override
    public List<PipResponse> getPipsByEmployee(Long employeeId) {

        return pipRecordRepository.findByEmployeeId(employeeId)
                .stream()
                .map(pipMapper::toResponse)
                .toList();
    }

    @Override
    public void activatePip(Long id) {
        PipRecord pip = pipRecordRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("PIP not found"));

        if (pip.getStatus() != PipStatus.DRAFT) {
            throw new RuntimeException("Only DRAFT PIP can be activated");
        }

        pip.setStatus(PipStatus.ACTIVE);
        pipRecordRepository.save(pip);
    }
}