package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.AuditRequest;
import ace.org.epms_backend.dto.appraisal.*;
import ace.org.epms_backend.dto.notification.NotificationEvent;
import ace.org.epms_backend.enums.AppraisalStatus;
import ace.org.epms_backend.enums.AuditAction;
import ace.org.epms_backend.enums.AuditStatus;
import ace.org.epms_backend.enums.FormType;
import ace.org.epms_backend.enums.NotificationType;
import ace.org.epms_backend.enums.ReferenceType;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.mapper.AppraisalMapper;
import ace.org.epms_backend.model.appraisal.Appraisal;
import ace.org.epms_backend.model.appraisal.AppraisalCycle;
import ace.org.epms_backend.model.appraisal.AppraisalForm;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.employee.ReportingLine;
import ace.org.epms_backend.repository.*;
import ace.org.epms_backend.repository.employee.ReportingLineRepository;
import ace.org.epms_backend.service.AppraisalCalculationService;
import ace.org.epms_backend.service.AppraisalService;
import ace.org.epms_backend.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AppraisalServiceImpl implements AppraisalService {

    private final AppraisalRepository appraisalRepo;
    private final EmployeeRepository employeeRepo;
    private final AppraisalCycleRepository cycleRepo;
    private final AppraisalFormRepository formRepo;
    private final ReportingLineRepository reportingLineRepo;
    private final AppraisalMapper appraisalMapper;
    private final AppraisalCalculationService calculationService;
    private final AppraisalSummaryRepository summaryRepo;
    private final AuditService auditService;
    private final ApplicationEventPublisher eventPublisher;

    private Long getCurrentUserId() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return employeeRepo.findByEmail(email).map(Employee::getId)
                .orElseThrow(() -> new NotFoundException("Current user not found"));
    }

    @Override
    @Transactional
    public AppraisalResponse assignAppraisal(AppraisalAssignRequest request) {
        return assignSingle(request.getEmployeeId(), request.getCycleId(), request.getFormId());
    }

    @Override
    @Transactional
    public List<AppraisalResponse> assignBulk(AppraisalBulkAssignRequest request) {
        List<AppraisalResponse> responses = new ArrayList<>();
        for (Long empId : request.getEmployeeIds()) {
            responses.add(assignSingle(empId, request.getCycleId(), request.getFormId()));
        }
        return responses;
    }

    private AppraisalResponse assignSingle(Long employeeId, Long cycleId, Long formId) {
        if (appraisalRepo.findByEmployee_IdAndCycle_CycleId(employeeId, cycleId).isPresent()) {
            throw new RuntimeException("Appraisal already assigned to this employee for the given cycle");
        }

        Employee employee = employeeRepo.findById(employeeId)
                .orElseThrow(() -> new NotFoundException("Employee not found"));

        AppraisalCycle cycle = cycleRepo.findById(cycleId)
                .orElseThrow(() -> new NotFoundException("Cycle not found"));

        if (!Boolean.TRUE.equals(cycle.getIsActive())) {
            throw new RuntimeException("Cannot assign appraisal to an inactive cycle: " + cycle.getCycleName());
        }

        // Resolve form
        AppraisalForm form = null;
        FormType formType = FormType.SELF_ASSESSMENT;
        if (formId != null) {
            form = formRepo.findById(formId)
                    .orElseThrow(() -> new NotFoundException("Form not found: " + formId));
            formType = form.getFormType();
        }

        // Resolve manager based on form type
        Employee manager = null;
        if (formType == FormType.SELF_ASSESSMENT) {
            // Employee fills the form → their manager must exist via ReportingLine
            manager = reportingLineRepo.findByEmployee_IdAndIsActiveTrue(employeeId)
                    .map(ReportingLine::getManager)
                    .orElseThrow(() -> new RuntimeException(
                            "No active manager found for employee: " + employee.getStaffName()));
        } else if (formType == FormType.MANAGER_EVALUATION) {
            // The assigned person IS the manager doing the evaluation → no lookup needed
            manager = null;
        } else if (formType == FormType.FEEDBACK) {
            // Feedback forms: manager is optional, look up if available
            manager = reportingLineRepo.findByEmployee_IdAndIsActiveTrue(employeeId)
                    .map(ReportingLine::getManager)
                    .orElse(null);
        }

        Appraisal appraisal = new Appraisal();
        appraisal.setEmployee(employee);
        appraisal.setManager(manager); // null for MANAGER_EVALUATION
        appraisal.setCycle(cycle);
        appraisal.setForm(form); // Link the specific form
        appraisal.setStatus(AppraisalStatus.PENDING);
        appraisal.setAssignedAt(Instant.now());

        Appraisal saved = appraisalRepo.save(appraisal);

        // Notify Employee
        eventPublisher.publishEvent(NotificationEvent.builder()
                .recipientId(employee.getId())
                .type(NotificationType.APPRAISAL_ASSIGNED)
                .title("Appraisal Assigned")
                .message("You have been assigned a new appraisal for cycle: " + cycle.getCycleName())
                .referenceType(ReferenceType.APPRAISAL)
                .referenceId(saved.getAppraisalId())
                .actionUrl("/appraisals/self-assessment/" + saved.getAppraisalId())
                .build());

        // Notify Manager (only for forms where a manager is assigned via ReportingLine)
        if (manager != null) {
            eventPublisher.publishEvent(NotificationEvent.builder()
                    .recipientId(manager.getId())
                    .type(NotificationType.MANAGER_EVALUATION_ASSIGNED)
                    .title("Evaluation Task")
                    .message("You have been assigned to evaluate: " + employee.getStaffName())
                    .referenceType(ReferenceType.APPRAISAL)
                    .referenceId(saved.getAppraisalId())
                    .actionUrl("/appraisals/manager-evaluation/" + saved.getAppraisalId())
                    .build());
        }

        auditService.log(AuditRequest.builder()

                .tableName("appraisals")
                .recordId(saved.getAppraisalId())
                .action(AuditAction.INSERT)
                .newState(saved)
                .status(AuditStatus.SUCCESS)
                .build());

        return enhanceResponse(appraisalMapper.toResponse(saved));
    }

    private AppraisalResponse enhanceResponse(AppraisalResponse response) {
        if (response == null) return null;
        summaryRepo.findByEmployee_IdAndCycle_CycleId(response.getEmployeeId(), response.getCycleId())
                .ifPresent(summary -> {
                    response.setFinalScore(summary.getTotalScore());
                    if (summary.getFinalGrade() != null) {
                        response.setFinalGrade(summary.getFinalGrade().name());
                    }
                });
        return response;
    }

    private List<AppraisalResponse> enhanceResponseList(List<AppraisalResponse> responses) {
        responses.forEach(this::enhanceResponse);
        return responses;
    }

    @Override
    public List<AppraisalResponse> getMyAssessments() {
        Long currentUserId = getCurrentUserId();
        return enhanceResponseList(appraisalMapper.toResponseList(appraisalRepo.findByEmployee_Id(currentUserId)));
    }

    @Override
    public List<AppraisalResponse> getTeamEvaluations() {
        Long currentUserId = getCurrentUserId();
        return enhanceResponseList(appraisalMapper.toResponseList(appraisalRepo.findByManager_Id(currentUserId)));
    }

    @Override
    public AppraisalResponse getById(Long id) {
        Appraisal appraisal = appraisalRepo.findById(id)
                .orElseThrow(() -> new NotFoundException("Appraisal not found"));
        return enhanceResponse(appraisalMapper.toResponse(appraisal));
    }

    @Override
    @Transactional
    public ScoreBreakdownResponse calculate(Long id) {
        return calculationService.calculateScore(id);
    }

    @Override
    @Transactional
    public AppraisalResponse approve(Long id, String comment) {
        Appraisal appraisal = appraisalRepo.findById(id)
                .orElseThrow(() -> new NotFoundException("Appraisal not found"));

        appraisal.setStatus(AppraisalStatus.HR_APPROVED);
        appraisal.setHrApprovedAt(Instant.now());
        appraisal.setApprovalComment(comment);

        Appraisal saved = appraisalRepo.save(appraisal);

        // Notify Sign-off Pending
        eventPublisher.publishEvent(NotificationEvent.builder()
                .recipientId(appraisal.getEmployee().getId())
                .type(NotificationType.SIGNOFF_PENDING)
                .title("Sign-off Required")
                .message("Your appraisal has been approved by HR. Please sign off.")
                .referenceType(ReferenceType.APPRAISAL)
                .referenceId(saved.getAppraisalId())
                .actionUrl("/appraisals/sign-off/" + saved.getAppraisalId())
                .build());

        // Notify Appraisal Approved
        eventPublisher.publishEvent(NotificationEvent.builder()
                .recipientId(appraisal.getEmployee().getId())
                .type(NotificationType.APPRAISAL_APPROVED)
                .title("Appraisal Approved")
                .message("Your appraisal has been approved by HR.")
                .referenceType(ReferenceType.APPRAISAL)
                .referenceId(saved.getAppraisalId())
                .build());

        auditService.log(AuditRequest.builder()

                .tableName("appraisals")
                .recordId(saved.getAppraisalId())
                .action(AuditAction.UPDATE)
                .newState(saved)
                .status(AuditStatus.SUCCESS)
                .build());

        return enhanceResponse(appraisalMapper.toResponse(saved));
    }

    @Override
    @Transactional
    public AppraisalResponse finalizeAppraisal(Long id) {
        Appraisal appraisal = appraisalRepo.findById(id)
                .orElseThrow(() -> new NotFoundException("Appraisal not found"));

        appraisal.setStatus(AppraisalStatus.FINALIZED);
        appraisal.setFinalizedAt(Instant.now());

        Appraisal saved = appraisalRepo.save(appraisal);

        // Notify Finalized/Locked
        eventPublisher.publishEvent(NotificationEvent.builder()
                .recipientId(appraisal.getEmployee().getId())
                .type(NotificationType.APPRAISAL_LOCKED)
                .title("Appraisal Finalized")
                .message("Your appraisal process is now complete and locked.")
                .referenceType(ReferenceType.APPRAISAL)
                .referenceId(saved.getAppraisalId())
                .build());

        auditService.log(AuditRequest.builder()

                .tableName("appraisals")
                .recordId(saved.getAppraisalId())
                .action(AuditAction.UPDATE)
                .newState(saved)
                .status(AuditStatus.SUCCESS)
                .build());

        return enhanceResponse(appraisalMapper.toResponse(saved));
    }

    @Override
    @Transactional
    public AppraisalResponse employeeSignOff(Long id, String comment) {
        Appraisal appraisal = appraisalRepo.findById(id)
                .orElseThrow(() -> new NotFoundException("Appraisal not found"));

        appraisal.setEmployeeSignedAt(Instant.now());
        // Since employeeSignComment is byte[], we convert string to bytes if used as a comment field
        if (comment != null) {
            appraisal.setEmployeeSignComment(comment.getBytes());
        }

        Appraisal saved = appraisalRepo.save(appraisal);

        eventPublisher.publishEvent(NotificationEvent.builder()
                .recipientId(appraisal.getEmployee().getId())
                .type(NotificationType.EMPLOYEE_SIGNED_OFF)
                .title("Employee Sign-off Complete")
                .message("You have signed off on your appraisal.")
                .referenceType(ReferenceType.APPRAISAL)
                .referenceId(saved.getAppraisalId())
                .build());

        auditService.log(AuditRequest.builder()
                .tableName("appraisals")
                .recordId(saved.getAppraisalId())
                .action(AuditAction.UPDATE)
                .newState(saved)
                .status(AuditStatus.SUCCESS)
                .build());

        return enhanceResponse(appraisalMapper.toResponse(saved));
    }

    @Override
    @Transactional
    public AppraisalResponse managerSignOff(Long id, String comment) {
        Appraisal appraisal = appraisalRepo.findById(id)
                .orElseThrow(() -> new NotFoundException("Appraisal not found"));

        appraisal.setManagerSignedAt(Instant.now());
        if (comment != null) {
            appraisal.setManagerSignComment(comment.getBytes());
        }

        Appraisal saved = appraisalRepo.save(appraisal);

        eventPublisher.publishEvent(NotificationEvent.builder()
                .recipientId(appraisal.getManager().getId())
                .type(NotificationType.MANAGER_SIGNED_OFF)
                .title("Manager Sign-off Complete")
                .message("You have signed off on the appraisal for "
                        + appraisal.getEmployee().getStaffName())
                .referenceType(ReferenceType.APPRAISAL)
                .referenceId(saved.getAppraisalId())
                .build());

        auditService.log(AuditRequest.builder()

                .tableName("appraisals")
                .recordId(saved.getAppraisalId())
                .action(AuditAction.UPDATE)
                .newState(saved)
                .status(AuditStatus.SUCCESS)
                .build());

        return enhanceResponse(appraisalMapper.toResponse(saved));
    }
    @Override
    public List<AppraisalResponse> getByCycleId(Long cycleId) {
        return enhanceResponseList(appraisalMapper.toResponseList(appraisalRepo.findByCycle_CycleId(cycleId)));
    }

    @Override
    @Transactional
    public void uploadEmployeeSignature(Long id, org.springframework.web.multipart.MultipartFile file) {
        Appraisal appraisal = appraisalRepo.findById(id)
                .orElseThrow(() -> new NotFoundException("Appraisal not found"));
        try {
            appraisal.setEmployeeSignComment(file.getBytes());
            appraisal.setEmployeeSignedAt(Instant.now());
            appraisalRepo.save(appraisal);
        } catch (java.io.IOException e) {
            throw new RuntimeException("Upload failed", e);
        }
    }

    @Override
    @Transactional
    public void uploadManagerSignature(Long id, org.springframework.web.multipart.MultipartFile file) {
        Appraisal appraisal = appraisalRepo.findById(id)
                .orElseThrow(() -> new NotFoundException("Appraisal not found"));
        try {
            appraisal.setManagerSignComment(file.getBytes());
            appraisal.setManagerSignedAt(Instant.now());
            appraisalRepo.save(appraisal);
        } catch (java.io.IOException e) {
            throw new RuntimeException("Upload failed", e);
        }
    }
}
