package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.pip.PipCreateRequest;
import ace.org.epms_backend.dto.pip.PipResponse;
import ace.org.epms_backend.dto.pip.PipUpdateRequest;
import ace.org.epms_backend.enums.PipStatus;
import ace.org.epms_backend.exception.InvalidStateException;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.exception.UserNotFoundException;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.pip.PipRecord;
import ace.org.epms_backend.repository.EmployeeRepository;
import ace.org.epms_backend.repository.PipRecordRepository;
import ace.org.epms_backend.service.PipService;
import ace.org.epms_backend.mapper.PipMapper;
import ace.org.epms_backend.enums.ObjectiveStatus;
import ace.org.epms_backend.model.pip.PipObjective;
import ace.org.epms_backend.repository.PipObjectiveRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class PipServiceImpl implements PipService {

    private final PipRecordRepository pipRecordRepository;
    private final EmployeeRepository employeeRepository;
    private final PipObjectiveRepository objectiveRepository;
    private final PipMapper pipMapper;

    @Override
    public PipResponse createPip(PipCreateRequest request) {

        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new UserNotFoundException("Employee not found"));

        Employee manager = employeeRepository.findById(request.getManagerId())
                .orElseThrow(() -> new UserNotFoundException("Manager not found"));

        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new InvalidStateException("End date cannot be before start date");
        }

        PipRecord pip = pipMapper.toEntity(request);

        pip.setEmployee(employee);
        pip.setManager(manager);
        pip.setStatus(PipStatus.DRAFT);

        pip = pipRecordRepository.save(pip);

        return pipMapper.toResponse(pip);
    }

    @Override
    public PipResponse updatePip(Long id, PipUpdateRequest request) {
        PipRecord pip = pipRecordRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("PIP not found"));

        if (pip.getStatus() == PipStatus.COMPLETED || pip.getStatus() == PipStatus.CLOSED) {
            throw new InvalidStateException("Cannot edit PIP after it is COMPLETED or CLOSED");
        }

        if (request.getManagerId() != null) {
            Employee manager = employeeRepository.findById(request.getManagerId())
                    .orElseThrow(() -> new UserNotFoundException("Manager not found"));
            pip.setManager(manager);
        }

        if (request.getReason() != null) {
            pip.setReason(request.getReason());
        }

        pip = pipRecordRepository.save(pip);
        return pipMapper.toResponse(pip);
    }

    @Override
    public PipResponse getPipById(Long id) {

        PipRecord pip = pipRecordRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("PIP not found"));

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
                .filter(pip -> pip.getStatus() != PipStatus.DRAFT)
                .map(pipMapper::toResponse)
                .toList();
    }

    @Override
    public List<PipResponse> getPipsByInvolvedUser(Long userId) {
        return pipRecordRepository.findByEmployeeIdOrManagerId(userId, userId)
                .stream()
                .filter(pip -> pip.getStatus() != PipStatus.DRAFT || pip.getManager().getId().equals(userId))
                .map(pipMapper::toResponse)
                .toList();
    }

    @Override
    public void activatePip(Long id) {
        PipRecord pip = pipRecordRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("PIP not found"));

        if (pip.getStatus() != PipStatus.DRAFT) {
            throw new InvalidStateException("Only DRAFT PIP can be activated");
        }

        pip.setStatus(PipStatus.ACTIVE);
        pipRecordRepository.save(pip);
    }

    @Override
    public PipResponse extendPip(Long id, LocalDate newEndDate) {
        PipRecord pip = pipRecordRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("PIP not found"));

        if (pip.getStatus() != PipStatus.ACTIVE && pip.getStatus() != PipStatus.EXTENDED) {
            throw new InvalidStateException("Only ACTIVE or EXTENDED PIP can be extended");
        }

        if (!newEndDate.isAfter(pip.getEndDate())) {
            throw new InvalidStateException("Extended date must be after current end date");
        }

        pip.setEndDate(newEndDate);
        pip.setStatus(PipStatus.EXTENDED);
        pip = pipRecordRepository.save(pip);

        return pipMapper.toResponse(pip);
    }

    @Override
    public void deletePip(Long id) {
        PipRecord pip = pipRecordRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("PIP not found"));

        if (pip.getStatus() != PipStatus.DRAFT) {
            throw new InvalidStateException("Only DRAFT PIP can be deleted");
        }

        List<PipObjective> objectives = objectiveRepository.findByPip_PipId(id);
        objectiveRepository.deleteAll(objectives);

        pipRecordRepository.delete(pip);
    }
}