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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PipServiceImpl implements PipService {

    private final PipRecordRepository pipRecordRepository;
    private final EmployeeRepository employeeRepository;

    @Override
    public PipResponse createPip(PipCreateRequest request) {

        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new UserNotFoundException("Employee not found"));

        Employee manager = employeeRepository.findById(request.getManagerId())
                .orElseThrow(() -> new UserNotFoundException("Manager not found"));

        PipRecord pip = new PipRecord();
        pip.setEmployee(employee);
        pip.setManager(manager);
        pip.setStartDate(request.getStartDate());
        pip.setEndDate(request.getEndDate());
        pip.setReason(request.getReason());

        pip.setStatus(PipStatus.DRAFT);

        pip = pipRecordRepository.save(pip);

        return mapToResponse(pip);
    }

    @Override
    public PipResponse getPipById(Long id) {
        PipRecord pip = pipRecordRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("PIP not found"));

        return mapToResponse(pip);
    }

    @Override
    public List<PipResponse> getAllPips() {
        return pipRecordRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<PipResponse> getPipsByEmployee(Long employeeId) {
        return pipRecordRepository.findByEmployeeId(employeeId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private PipResponse mapToResponse(PipRecord pip) {
        PipResponse response = new PipResponse();
        response.setPipId(pip.getPipId());
        response.setEmployeeId(pip.getEmployee().getId());
        response.setManagerId(pip.getManager().getId());
        response.setStartDate(pip.getStartDate());
        response.setEndDate(pip.getEndDate());
        response.setStatus(pip.getStatus());
        response.setFinalOutcome(pip.getFinalOutcome());
        response.setReason(pip.getReason());
        return response;
    }
}