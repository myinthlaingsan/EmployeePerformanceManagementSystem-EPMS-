package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.AuditRequest;
import ace.org.epms_backend.dto.appraisal.*;
import ace.org.epms_backend.dto.notification.NotificationEvent;
import ace.org.epms_backend.enums.*;
import ace.org.epms_backend.exception.AlreadyAssignException;
import ace.org.epms_backend.exception.InvalidStateException;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.mapper.AppraisalMapper;
import ace.org.epms_backend.model.appraisal.*;
import ace.org.epms_backend.model.employee.*;
import ace.org.epms_backend.repository.*;
import ace.org.epms_backend.repository.appraisal.AppraisalFormSetRepository;
import ace.org.epms_backend.repository.employee.ReportingLineRepository;
import ace.org.epms_backend.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

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
        private final EmployeeDepartmentRepository empDeptRepo;
        private final AppraisalFormSetRepository formSetRepo;
        private final AppraisalMapper appraisalMapper;
        private final AppraisalCalculationService calculationService;
        private final AppraisalSummaryRepository summaryRepo;
        private final SelfAssessmentService selfService;
        private final AuditService auditService;
        private final ApplicationEventPublisher eventPublisher;
        private final AuthService authService;
        private Long getCurrentUserId() {
                String email = SecurityContextHolder.getContext().getAuthentication().getName();
                return employeeRepo.findByEmail(email).map(Employee::getId)
                                .orElseThrow(() -> new NotFoundException("Current user not found"));
        }

        @Override
        @Transactional
        public List<AppraisalResponse> assignBulk(AppraisalBulkAssignRequest request) {
                List<AppraisalResponse> responses = new ArrayList<>();
                for (Long empId : request.getEmployeeIds()) {
                        responses.add(assignSingle(empId, request.getCycleId(), request.getFormId(), request.getFormSetId()));
                }
                return responses;
        }

        @Override
        @Transactional
        public AppraisalResponse assignAppraisal(AppraisalAssignRequest request) {
                return assignSingle(request.getEmployeeId(), request.getCycleId(), request.getFormId(), request.getFormSetId());
        }

        private AppraisalResponse assignSingle(Long employeeId, Long cycleId, Long formId, Long formSetId) {
                if (appraisalRepo.findByEmployee_IdAndCycle_CycleId(employeeId, cycleId).isPresent()) {
                        throw new AlreadyAssignException("Appraisal already assigned to this employee for the given cycle");
                }

                Employee employee = employeeRepo.findById(employeeId)
                                .orElseThrow(() -> new NotFoundException("Employee not found"));

                AppraisalCycle cycle = cycleRepo.findById(cycleId)
                                .orElseThrow(() -> new NotFoundException("Cycle not found"));

                // Resolve form set or individual form
                AppraisalFormSet formSet = null;
                AppraisalForm form = null;
                FormType formType = FormType.SELF_ASSESSMENT;

                if (formSetId != null) {
                        formSet = formSetRepo.findById(formSetId)
                                        .orElseThrow(() -> new NotFoundException("Form Set not found: " + formSetId));
                        if (formSet.getSelfAssessmentForm() != null) {
                                formType = formSet.getSelfAssessmentForm().getFormType();
                        }
                } else if (formId != null) {
                        form = formRepo.findById(formId)
                                        .orElseThrow(() -> new NotFoundException("Form not found: " + formId));
                        formType = form.getFormType();
                }

                // Resolve manager based on form type
                Employee manager = null;
                if (formType == FormType.SELF_ASSESSMENT) {
                        // Employee fills the form → their manager must exist via ReportingLine
                        manager = reportingLineRepo.findFirstByEmployee_IdAndIsActiveTrue(employeeId)
                                        .map(ReportingLine::getManager)
                                        .orElseThrow(() -> new RuntimeException(
                                                        "No active manager found for employee: "
                                                                        + employee.getStaffName()));
                } else if (formType == FormType.MANAGER_EVALUATION) {
                        // If it's a standalone manager evaluation, we STILL need to know WHO the manager is.
                        // Look up via ReportingLine so they can actually evaluate.
                        manager = reportingLineRepo.findByEmployeeAndIsActiveTrue(manager)
                                        .map(ReportingLine::getManager)
                                        .orElse(null);
                } else if (formType == FormType.FEEDBACK) {
                        // Feedback forms: manager is optional, look up if available
                        manager = reportingLineRepo.findFirstByEmployee_IdAndIsActiveTrue(employeeId)
                                        .map(ReportingLine::getManager)
                                        .orElse(null);
                }

                Appraisal appraisal = new Appraisal();
                appraisal.setEmployee(employee);
                appraisal.setManager(manager); // null for MANAGER_EVALUATION
                appraisal.setCycle(cycle);
                appraisal.setFormSet(formSet);
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

                return appraisalMapper.toResponse(saved);
        }

        @Override
        public List<AppraisalResponse> getMyAssessments() {
                Long currentUserId = getCurrentUserId();
                return appraisalMapper.toResponseList(appraisalRepo.findByEmployee_Id(currentUserId));
        }

        @Override
        public List<AppraisalResponse> getTeamEvaluations() {
                Long currentUserId = getCurrentUserId();
                return appraisalMapper.toResponseList(appraisalRepo.findByManager_Id(currentUserId));
        }

        @Override
        public List<AppraisalResponse> getDepartmentAppraisals() {
                Long currentUserId = getCurrentUserId();

                // Find current user's department
                EmployeeDepartment dept = empDeptRepo.findByEmployeeIdAndIsCurrentTrue(currentUserId)
                                .orElseThrow(() -> new RuntimeException("Current user has no department assigned"));

                // Find all appraisals for employees in that department
                List<Appraisal> departmentAppraisals = appraisalRepo
                                .findByDepartmentId(dept.getCurrentDepartment().getId());

                return appraisalMapper.toResponseList(departmentAppraisals);
        }

        @Override
        public List<AppraisalResponse> getAppraisalsToEvaluate() {
                Long currentUserId = getCurrentUserId();
                return appraisalMapper.toResponseList(
                                appraisalRepo.findByManager_IdAndStatusIn(currentUserId,
                                                List.of(AppraisalStatus.SELF_ASSESSED)));
        }

        @Override
        public EmployeeSelfAssessmentViewResponse getEmployeeView(Long appraisalId) {
                Appraisal appraisal = appraisalRepo.findById(appraisalId)
                                .orElseThrow(() -> new NotFoundException("Appraisal not found"));

                FullSelfAssessmentResponse fullSelf = selfService.getMyAssessmentForm(appraisalId);

                List<CategoryViewDTO> categoryViews = fullSelf.getCategories().stream().map(cat -> {
                        List<QuestionViewDTO> questionViews = cat.getQuestions().stream().map(q -> {
                                return QuestionViewDTO.builder()
                                                .questionText(q.getQuestionText())
                                                .questionType(q.getQuestionType())
                                                .ratingValue(q.getRatingValue())
                                                .isCompleted(q.getIsCompleted())
                                                .comment(q.getComment())
                                                .build();
                        }).toList();

                        return CategoryViewDTO.builder()
                                        .categoryName(cat.getCategoryName())
                                        .questions(questionViews)
                                        .build();
                }).toList();

                return EmployeeSelfAssessmentViewResponse.builder()
                                .selfAssessmentId(fullSelf.getSelfAssessmentId())
                                .appraisalId(fullSelf.getAppraisalId())
                                .employeeName(fullSelf.getEmployeeName())
                                .employeeCode(fullSelf.getEmployeeCode())
                                .departmentName(fullSelf.getDepartmentName() != null ? fullSelf.getDepartmentName()
                                                : "N/A")
                                .positionName(fullSelf.getPositionName() != null ? fullSelf.getPositionName() : "N/A")
                                .totalScore(fullSelf.getTotalScore())
                                .submittedAt(fullSelf.getSubmittedAt())
                                .categories(categoryViews)
                                .build();
        }

        @Override
        public AppraisalResponse getById(Long id) {
                Appraisal appraisal = appraisalRepo.findById(id)
                                .orElseThrow(() -> new NotFoundException("Appraisal not found"));
                AppraisalResponse response = appraisalMapper.toResponse(appraisal);
                
                summaryRepo.findByEmployee_IdAndCycle_CycleId(appraisal.getEmployee().getId(), appraisal.getCycle().getCycleId())
                    .ifPresent(s -> {
                        response.setFinalScore(s.getTotalScore());
                        response.setFinalGrade(s.getFinalGrade() != null ? s.getFinalGrade().name() : null);
                    });
                    
                return response;
        }

        @Override
        @Transactional
        public ScoreBreakdownResponse calculate(Long id) {
                return calculationService.calculateScore(id);
        }

        @Override
        @Transactional(readOnly = true)
        public ScoreBreakdownResponse getScoreBreakdown(Long id) {
                Appraisal appraisal = appraisalRepo.findById(id)
                                .orElseThrow(() -> new NotFoundException("Appraisal not found"));

                Long currentUserId = getCurrentUserId();
                boolean isOwner = appraisal.getEmployee().getId().equals(currentUserId);
                boolean isManager = appraisal.getManager() != null && appraisal.getManager().getId().equals(currentUserId);
                boolean isHrOrAdmin = SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                                .anyMatch(a -> a.getAuthority().equals("ROLE_HR") || a.getAuthority().equals("ROLE_ADMIN"));

                if (!isOwner && !isManager && !isHrOrAdmin) {
                        throw new org.springframework.security.access.AccessDeniedException("Not allowed to view this score breakdown.");
                }

                return calculationService.getScoreBreakdown(id);
        }


        @Override
        @Transactional
        public AppraisalResponse approve(Long id, String comment) {
                Appraisal appraisal = appraisalRepo.findById(id)
                                .orElseThrow(() -> new NotFoundException("Appraisal not found"));

                // Guard: must be EVALUATED before HR can approve
                if (appraisal.getStatus() != AppraisalStatus.EVALUATED) {
                        throw new RuntimeException(
                                "Cannot approve: appraisal must be EVALUATED first. Current status: "
                                + appraisal.getStatus());
                }

                appraisal.setStatus(AppraisalStatus.HR_APPROVED);
                appraisal.setHrApprovedAt(Instant.now());
                appraisal.setApprovalComment(comment);
                appraisal.setApprovedBy(authService.getCurrentUser());
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

                return appraisalMapper.toResponse(saved);
        }

        @Override
        @Transactional
        public AppraisalResponse finalizeAppraisal(Long id) {
                Appraisal appraisal = appraisalRepo.findById(id)
                                .orElseThrow(() -> new NotFoundException("Appraisal not found"));

                // Guard 1: must be HR_APPROVED before finalization
                if (appraisal.getStatus() != AppraisalStatus.HR_APPROVED) {
                        throw new RuntimeException(
                                "Cannot finalize: appraisal must be HR_APPROVED first. Current status: "
                                + appraisal.getStatus());
                }

                // Guard 2: both signatures must be captured before finalization
                if (appraisal.getEmployeeSignedAt() == null && appraisal.getManagerSignedAt() == null) {
                        throw new InvalidStateException(
                                "Cannot finalize: employee and manager have not signed off yet.");
                }
                if (appraisal.getEmployeeSignedAt() == null) {
                        throw new InvalidStateException(
                                "Cannot finalize: awaiting employee signature.");
                }
                if (appraisal.getManagerSignedAt() == null) {
                        throw new InvalidStateException(
                                "Cannot finalize: awaiting manager signature.");
                }

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

                return appraisalMapper.toResponse(saved);
        }

        @Override
        @Transactional
        public AppraisalResponse employeeSignOff(Long id, String comment) {
                Appraisal appraisal = appraisalRepo.findById(id)
                                .orElseThrow(() -> new NotFoundException("Appraisal not found"));

                // Guard: sign-off only allowed after HR approval
                if (appraisal.getStatus() != AppraisalStatus.HR_APPROVED) {
                        throw new RuntimeException(
                                "Sign-off is only available after HR approval. Current status: "
                                + appraisal.getStatus());
                }

                appraisal.setEmployeeSignedAt(Instant.now());
                if (comment != null) {
                        appraisal.setEmployeeSignNote(comment);
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

                return appraisalMapper.toResponse(saved);
        }

        @Override
        @Transactional
        public AppraisalResponse managerSignOff(Long id, String comment) {
                Appraisal appraisal = appraisalRepo.findById(id)
                                .orElseThrow(() -> new NotFoundException("Appraisal not found"));

                appraisal.setManagerSignedAt(Instant.now());
            if (comment != null) {
                appraisal.setManagerSignNote(comment);
            }

                Appraisal saved = appraisalRepo.save(appraisal);

                // NPE guard: only notify if a manager is actually assigned
                if (appraisal.getManager() != null) {
                        eventPublisher.publishEvent(NotificationEvent.builder()
                                        .recipientId(appraisal.getManager().getId())
                                        .type(NotificationType.MANAGER_SIGNED_OFF)
                                        .title("Manager Sign-off Complete")
                                        .message("You have signed off on the appraisal for "
                                                        + appraisal.getEmployee().getStaffName())
                                        .referenceType(ReferenceType.APPRAISAL)
                                        .referenceId(saved.getAppraisalId())
                                        .build());
                }

                auditService.log(AuditRequest.builder()

                                .tableName("appraisals")
                                .recordId(saved.getAppraisalId())
                                .action(AuditAction.UPDATE)
                                .newState(saved)
                                .status(AuditStatus.SUCCESS)
                                .build());

                return appraisalMapper.toResponse(saved);
        }

        @Override
        @Transactional
        public void deleteAppraisal(Long id) {
                Appraisal appraisal = appraisalRepo.findById(id)
                                .orElseThrow(() -> new NotFoundException("Appraisal not found"));

                // Only allow deletion if still PENDING or if user is ADMIN
                if (appraisal.getStatus() != AppraisalStatus.PENDING) {
                        // Check if user has ADMIN role?
                        // For now, let's just restrict it to PENDING to be safe.
                        throw new RuntimeException("Cannot delete an appraisal that is already in progress. Status: "
                                        + appraisal.getStatus());
                }

                appraisalRepo.delete(appraisal);

                auditService.log(AuditRequest.builder()
                                .tableName("appraisals")
                                .recordId(id)
                                .action(AuditAction.DELETE)
                                .status(AuditStatus.SUCCESS)
                                .build());
        }

    @Override
    public List<AppraisalResponse> getByCycleId(Long cycleId) {
        List<Appraisal> appraisals = appraisalRepo.findByCycle_CycleId(cycleId);
        List<AppraisalResponse> responses = appraisalMapper.toResponseList(appraisals);
        
        // Map scores
        for (int i = 0; i < appraisals.size(); i++) {
            Appraisal a = appraisals.get(i);
            AppraisalResponse r = responses.get(i);
            r.setDepartmentName(empDeptRepo.findByEmployeeIdAndIsCurrentTrue(a.getEmployee().getId())
                .map(EmployeeDepartment::getCurrentDepartment)
                .map(Department::getDepartmentName)
                .orElse("N/A"));
            summaryRepo.findByEmployee_IdAndCycle_CycleId(a.getEmployee().getId(), a.getCycle().getCycleId())
                .ifPresent(s -> {
                    r.setFinalScore(s.getTotalScore());
                    r.setFinalGrade(s.getFinalGrade() != null ? s.getFinalGrade().name() : null);
                });
        }
        return responses;
    }

    private final String UPLOAD_DIR = "uploads/signatures/";

    private String saveSignatureFile(MultipartFile file, Long appraisalId, String type) throws java.io.IOException {
        java.nio.file.Path uploadPath = java.nio.file.Paths.get(UPLOAD_DIR);
        if (!java.nio.file.Files.exists(uploadPath)) {
            java.nio.file.Files.createDirectories(uploadPath);
        }
        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename != null && originalFilename.contains(".")
                ? originalFilename.substring(originalFilename.lastIndexOf("."))
                : ".png";
        String fileName = type + "_" + appraisalId + "_" + Instant.now().toEpochMilli() + extension;
        java.nio.file.Path filePath = uploadPath.resolve(fileName);
        java.nio.file.Files.copy(file.getInputStream(), filePath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
        // We prepend a forward slash for serving
        return "/uploads/signatures/" + fileName;
    }

    @Override
    @Transactional
    public void uploadEmployeeSignature(Long id, MultipartFile file) {
        Appraisal appraisal = appraisalRepo.findById(id)
                .orElseThrow(() -> new NotFoundException("Appraisal not found"));
        try {
            String path = saveSignatureFile(file, id, "employee");
            appraisal.setEmployeeSignComment(path);
            appraisal.setEmployeeSignedAt(Instant.now());
            appraisalRepo.save(appraisal);
        } catch (java.io.IOException e) {
            throw new RuntimeException("Upload failed", e);
        }
    }

    @Override
    @Transactional
    public void uploadManagerSignature(Long id, MultipartFile file) {
        Appraisal appraisal = appraisalRepo.findById(id)
                .orElseThrow(() -> new NotFoundException("Appraisal not found"));
        try {
            String path = saveSignatureFile(file, id, "manager");
            appraisal.setManagerSignComment(path);
            appraisal.setManagerSignedAt(Instant.now());
            appraisalRepo.save(appraisal);
        } catch (java.io.IOException e) {
            throw new RuntimeException("Upload failed", e);
        }
    }
}
