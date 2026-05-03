package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.pip.PipCreateRequest;
import ace.org.epms_backend.dto.pip.PipResponse;
import ace.org.epms_backend.dto.pip.PipUpdateRequest;
import ace.org.epms_backend.enums.PipStatus;
import ace.org.epms_backend.exception.AccessDeniedException;
import ace.org.epms_backend.exception.InvalidStateException;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.exception.UserNotFoundException;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.pip.PipRecord;
import ace.org.epms_backend.repository.EmployeeRepository;
import ace.org.epms_backend.repository.PipRecordRepository;
import ace.org.epms_backend.service.PipService;
import ace.org.epms_backend.service.AuthService;
import ace.org.epms_backend.service.EmployeeRoleService;
import ace.org.epms_backend.mapper.PipMapper;
import ace.org.epms_backend.enums.ObjectiveStatus;
import ace.org.epms_backend.model.pip.PipObjective;
import ace.org.epms_backend.repository.PipObjectiveRepository;
import ace.org.epms_backend.dto.pip.PipExtendRequest;
import ace.org.epms_backend.dto.notification.NotificationEvent;
import ace.org.epms_backend.enums.NotificationType;
import ace.org.epms_backend.enums.ReferenceType;
import ace.org.epms_backend.repository.PipProgressLogRepository;
import lombok.RequiredArgsConstructor;
import ace.org.epms_backend.dto.AuditRequest;
import ace.org.epms_backend.enums.AuditAction;
import ace.org.epms_backend.enums.AuditStatus;
import ace.org.epms_backend.service.AuditService;
import org.springframework.context.ApplicationEventPublisher;
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
    private final PipProgressLogRepository progressLogRepository;
    private final PipMapper pipMapper;
    private final ApplicationEventPublisher eventPublisher;
    private final AuditService auditService;
    private final AuthService authService;
    private final EmployeeRoleService employeeRoleService;

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

        // Log Audit
        auditService.log(AuditRequest.builder()
                .tableName("pip_records")
                .recordId(pip.getPipId())
                .action(AuditAction.INSERT)
                .newState(pip)
                .status(AuditStatus.SUCCESS)
                .build());

        eventPublisher.publishEvent(NotificationEvent.builder()
                .recipientId(employee.getId())
                .senderId(manager.getId())
                .type(NotificationType.PIP_CREATED)
                .title("New PIP Created")
                .message("A Performance Improvement Plan (PIP) has been drafted for you.")
                .referenceType(ReferenceType.PIP)
                .referenceId(pip.getPipId())
                .actionUrl("/pips/" + pip.getPipId())
                .build());

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

        if (request.getManagerPrivateNote() != null) {
            pip.setManagerPrivateNote(request.getManagerPrivateNote());
        }

        if (request.getEmployeePrivateNote() != null) {
            pip.setEmployeePrivateNote(request.getEmployeePrivateNote());
        }

        pip = pipRecordRepository.save(pip);
        return pipMapper.toResponse(pip);
    }

    @Override
    public PipResponse getPipById(Long id) {

        PipRecord pip = pipRecordRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("PIP not found"));

        return enrichPipResponse(pip);
    }

    @Override
    public List<PipResponse> getAllPips() {

        return pipRecordRepository.findAll()
                .stream()
                .map(this::enrichPipResponse)
                .toList();
    }

    @Override
    public List<PipResponse> getPipsByEmployee(Long employeeId) {

        return pipRecordRepository.findByEmployeeId(employeeId)
                .stream()
                .filter(pip -> pip.getStatus() != PipStatus.DRAFT)
                .map(this::enrichPipResponse)
                .toList();
    }

    @Override
    public List<PipResponse> getPipsByInvolvedUser(Long userId) {
        return pipRecordRepository.findByEmployeeIdOrManagerId(userId, userId)
                .stream()
                .filter(pip -> pip.getStatus() != PipStatus.DRAFT || pip.getManager().getId().equals(userId))
                .map(this::enrichPipResponse)
                .toList();
    }

    private PipResponse enrichPipResponse(PipRecord pip) {
        PipResponse response = pipMapper.toResponse(pip);
        
        List<PipObjective> objectives = pip.getObjectives();
        if (objectives == null || objectives.isEmpty()) {
            response.setOverallProgress(0);
        } else {
            double totalProgress = objectives.stream()
                .mapToDouble(obj -> progressLogRepository.findFirstByObjective_ObjectiveIdOrderByCreatedAtDesc(obj.getObjectiveId())
                    .map(log -> log.getProgressPercent().doubleValue())
                    .orElse(0.0))
                .average()
                .orElse(0.0);
            response.setOverallProgress((int) Math.round(totalProgress));
        }
        
        return response;
    }

    @Override
    public void activatePip(Long id) {
        PipRecord pip = pipRecordRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("PIP not found"));

        Employee current = authService.getCurrentUser();
        boolean isHR = employeeRoleService.getRolesByEmployeeId(current.getId())
                .stream()
                .anyMatch(r -> r.getRoleName().equalsIgnoreCase("HR"));
        boolean isAssignedManager = pip.getManager().getId().equals(current.getId());

        if (!isHR && !isAssignedManager) {
            throw new AccessDeniedException("Only HR or the assigned Manager can activate this PIP");
        }

        if (pip.getStatus() != PipStatus.DRAFT) {
            throw new InvalidStateException("Only DRAFT PIP can be activated");
        }

        pip.setStatus(PipStatus.ACTIVE);
        pip = pipRecordRepository.save(pip);

        // Log Audit
        auditService.log(AuditRequest.builder()
                .tableName("pip_records")
                .recordId(pip.getPipId())
                .action(AuditAction.UPDATE)
                .newState(pip)
                .status(AuditStatus.SUCCESS)
                .build());

        eventPublisher.publishEvent(NotificationEvent.builder()
                .recipientId(pip.getEmployee().getId())
                .senderId(pip.getManager().getId())
                .type(NotificationType.PIP_UPDATED)
                .title("PIP Activated")
                .message("Your Performance Improvement Plan (PIP) is now ACTIVE.")
                .referenceType(ReferenceType.PIP)
                .referenceId(pip.getPipId())
                .actionUrl("/pips/" + pip.getPipId())
                .build());
    }

    @Override
    public PipResponse extendPip(Long id, PipExtendRequest request) {
        PipRecord pip = pipRecordRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("PIP not found"));

        Employee current = authService.getCurrentUser();
        boolean isHR = employeeRoleService.getRolesByEmployeeId(current.getId())
                .stream()
                .anyMatch(r -> r.getRoleName().equalsIgnoreCase("HR"));
        boolean isAssignedManager = pip.getManager().getId().equals(current.getId());

        if (!isHR && !isAssignedManager) {
            throw new AccessDeniedException("Only HR or the assigned Manager can extend this PIP");
        }

        if (pip.getStatus() != PipStatus.ACTIVE && pip.getStatus() != PipStatus.EXTENDED) {
            throw new InvalidStateException("Only ACTIVE or EXTENDED PIP can be extended");
        }

        if (!request.getNewEndDate().isAfter(pip.getEndDate())) {
            throw new InvalidStateException("Extended date must be after current end date");
        }

        pip.setEndDate(request.getNewEndDate());
        if (request.getScheduledReviewDates() != null) {
            pip.setScheduledReviewDates(request.getScheduledReviewDates());
        }
        pip.setStatus(PipStatus.EXTENDED);
        pip = pipRecordRepository.save(pip);

        // Log Audit
        auditService.log(AuditRequest.builder()
                .tableName("pip_records")
                .recordId(pip.getPipId())
                .action(AuditAction.UPDATE)
                .newState(pip)
                .status(AuditStatus.SUCCESS)
                .build());

        eventPublisher.publishEvent(NotificationEvent.builder()
                .recipientId(pip.getEmployee().getId())
                .senderId(pip.getManager().getId())
                .type(NotificationType.PIP_UPDATED)
                .title("PIP Extended")
                .message("Your Performance Improvement Plan (PIP) has been extended until " + request.getNewEndDate())
                .referenceType(ReferenceType.PIP)
                .referenceId(pip.getPipId())
                .actionUrl("/pips/" + pip.getPipId())
                .build());

        return enrichPipResponse(pip);
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