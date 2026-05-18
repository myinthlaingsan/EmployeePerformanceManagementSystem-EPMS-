package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.AuditRequest;
import ace.org.epms_backend.dto.appraisal.*;
import ace.org.epms_backend.dto.notification.NotificationEvent;
import ace.org.epms_backend.enums.*;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.mapper.ManagerEvaluationMapper;
import ace.org.epms_backend.model.appraisal.*;
import ace.org.epms_backend.model.employee.EmployeeDepartment;
import ace.org.epms_backend.repository.*;
import ace.org.epms_backend.service.AuditService;
import ace.org.epms_backend.service.ManagerEvaluationService;
import ace.org.epms_backend.service.SelfAssessmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ManagerEvaluationServiceImpl implements ManagerEvaluationService {

    private final AppraisalRepository appraisalRepo;
    private final ManagerEvaluationRepository evalRepo;
    private final ManagerEvaluationAnswerRepository answerRepo;
    private final SelfAssessmentRepository selfRepo;
    private final SelfAssessmentAnswerRepository selfAnswerRepo;
    private final QuestionRepository questionRepo;
    private final FormCategoryRepository categoryRepo;
    private final ManagerEvaluationMapper evalMapper;
    private final EmployeeDepartmentRepository empDeptRepo;
    private final SelfAssessmentService selfService;

    private final AuditService auditService;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional
    public ManagerEvaluationResponse create(ManagerEvaluationRequest request) {
        Appraisal appraisal = appraisalRepo.findById(request.getAppraisalId())
                .orElseThrow(() -> new NotFoundException("Appraisal not found"));

        ManagerEvaluation eval = evalRepo.findByAppraisal_AppraisalId(request.getAppraisalId())
                .orElseGet(() -> {
                    ManagerEvaluation newEval = new ManagerEvaluation();
                    newEval.setAppraisal(appraisal);
                    newEval.setSubmitted(false);
                    return evalRepo.save(newEval);
                });

        return evalMapper.toResponse(eval);
    }

    @Override
    public FullManagerEvaluationResponse getEvaluationForm(Long appraisalId) {
        Appraisal appraisal = appraisalRepo.findById(appraisalId)
                .orElseThrow(() -> new NotFoundException("Appraisal not found"));

        ManagerEvaluation eval = evalRepo.findByAppraisal_AppraisalId(appraisalId)
                .orElseGet(() -> {
                    ManagerEvaluation newEval = new ManagerEvaluation();
                    newEval.setAppraisal(appraisal);
                    newEval.setSubmitted(false);
                    return evalRepo.save(newEval);
                });

        return buildFullResponse(appraisal, eval);
    }

    @Override
    @Transactional
    public void saveAnswers(Long evaluationId, List<ManagerEvaluationAnswerRequest> answers) {
        ManagerEvaluation eval = evalRepo.findById(evaluationId)
                .orElseThrow(() -> new NotFoundException("Evaluation not found"));

        if (eval.getAppraisal().getStatus() == AppraisalStatus.HR_APPROVED || 
            eval.getAppraisal().getStatus() == AppraisalStatus.FINALIZED) {
            throw new RuntimeException("Cannot modify an evaluation that has been approved or finalized");
        }

        for (ManagerEvaluationAnswerRequest req : answers) {
            Question question = questionRepo.findById(req.getQuestionId())
                    .orElseThrow(() -> new NotFoundException(
                            "Question not found: " + req.getQuestionId()));

            ManagerEvaluationAnswer answer = answerRepo.findByEvaluation_EvaluationIdAndQuestion_QuestionId(
                            evaluationId, req.getQuestionId())
                    .orElseGet(() -> {
                        ManagerEvaluationAnswer newAnswer = new ManagerEvaluationAnswer();
                        newAnswer.setEvaluation(eval);
                        newAnswer.setQuestion(question);
                        return newAnswer;
                    });

            answer.setRatingValue(req.getRatingValue());
            answer.setComment(req.getComment());
            answerRepo.save(answer);
        }
    }

    @Override
    @Transactional
    public void saveDraft(Long evaluationId, String finalComment) {
        ManagerEvaluation eval = evalRepo.findById(evaluationId)
                .orElseThrow(() -> new NotFoundException("Evaluation not found"));

        eval.setFinalComment(finalComment);
        eval.setLastSavedAt(Instant.now());
        evalRepo.save(eval);
    }

    @Override
    @Transactional
    public void submitFinal(Long evaluationId) {
        ManagerEvaluation eval = evalRepo.findById(evaluationId)
                .orElseThrow(() -> new NotFoundException("Evaluation not found"));

        if (eval.getAppraisal().getStatus() == AppraisalStatus.HR_APPROVED || 
            eval.getAppraisal().getStatus() == AppraisalStatus.FINALIZED) {
            throw new RuntimeException("Cannot submit an evaluation that has been approved or finalized");
        }

        // Guard: manager evaluation can only be submitted during IN_PROGRESS or EVALUATION phase.
        // IN_PROGRESS = self-assessment phase (employees submit); managers may also evaluate
        // as soon as an employee's self-assessment is done, without waiting for the scheduler
        // to flip the cycle to EVALUATION.
        CycleStatus cycleStatus = eval.getAppraisal().getCycle().getStatus();
        if (cycleStatus != CycleStatus.EVALUATION && cycleStatus != CycleStatus.IN_PROGRESS) {
            throw new RuntimeException(
                "Manager evaluation submission is not open. Cycle phase: " + cycleStatus);
        }

        // Calculate total score based on formula: (Total Point * 100) / (Number of Questions Answered * 5)
        List<ManagerEvaluationAnswer> answers = answerRepo.findByEvaluation_EvaluationId(evaluationId);
        BigDecimal sum = BigDecimal.ZERO;
        int answeredCount = 0;

        for (ManagerEvaluationAnswer ans : answers) {
            if (ans.getRatingValue() != null) {
                sum = sum.add(BigDecimal.valueOf(ans.getRatingValue()));
                answeredCount++;
            }
        }

        BigDecimal finalScore = BigDecimal.ZERO;
        if (answeredCount > 0) {
            BigDecimal maxPossiblePoints = BigDecimal.valueOf(answeredCount).multiply(BigDecimal.valueOf(5));
            finalScore = sum.multiply(BigDecimal.valueOf(100))
                    .divide(maxPossiblePoints, 2, java.math.RoundingMode.HALF_UP);
        }

        eval.setTotalScore(finalScore);
        eval.setSubmitted(true);
        eval.setSubmittedAt(Instant.now());
        evalRepo.save(eval);

        // Update Appraisal status
        Appraisal appraisal = eval.getAppraisal();
        appraisal.setStatus(AppraisalStatus.EVALUATED);
        appraisal.setManagerSubmittedAt(Instant.now());
        appraisalRepo.save(appraisal);

        // Notify HR
        eventPublisher.publishEvent(NotificationEvent.builder()
                .targetRole("HR")
                .type(NotificationType.MANAGER_EVALUATION_SUBMITTED)
                .title("Evaluation Submitted")
                .message("Manager " + appraisal.getManager().getStaffName()
                        + " has submitted evaluation for "
                        + appraisal.getEmployee().getStaffName())
                .referenceType(ReferenceType.APPRAISAL)
                .referenceId(appraisal.getAppraisalId())
                .build());

        // Log Audit
        auditService.log(AuditRequest.builder()
                .tableName("manager_evaluations")
                .recordId(evaluationId)
                .action(AuditAction.UPDATE)
                .newState(eval)
                .status(AuditStatus.SUCCESS)
                .build());
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

        // Get Department/Position info
        String departmentName = "N/A";
        String positionName = appraisal.getEmployee().getPosition() != null
                ? appraisal.getEmployee().getPosition().getPositionName()
                : "N/A";

        EmployeeDepartment ed = empDeptRepo
                .findByEmployeeIdAndIsCurrentTrue(appraisal.getEmployee().getId())
                .orElse(null);

        if (ed != null && ed.getCurrentDepartment() != null) {
            departmentName = ed.getCurrentDepartment().getDepartmentName();
        }

        return EmployeeSelfAssessmentViewResponse.builder()
                .selfAssessmentId(fullSelf.getSelfAssessmentId())
                .appraisalId(fullSelf.getAppraisalId())
                .employeeName(appraisal.getEmployee().getStaffName())
                .employeeCode(appraisal.getEmployee().getEmployeeCode())
                .departmentName(departmentName)
                .positionName(positionName)
                .totalScore(fullSelf.getTotalScore())
                .submittedAt(fullSelf.getSubmittedAt())
                .categories(categoryViews)
                .build();
    }

    private FullManagerEvaluationResponse buildFullResponse(Appraisal appraisal, ManagerEvaluation eval) {
        // Use the specific form linked to the appraisal via FormSet
        AppraisalForm form = null;
        if (appraisal.getFormSet() != null) {
            form = appraisal.getFormSet().getManagerEvaluationForm();
        }

        if (form == null) {
            // Fallback: Find the first MANAGER_EVALUATION form in the cycle
            form = appraisal.getCycle().getForms().stream()
                    .filter(f -> f.getFormType() == FormType.MANAGER_EVALUATION)
                    .findFirst()
                    .orElseThrow(() -> new NotFoundException(
                            "No MANAGER_EVALUATION form found for appraisal: "
                                    + appraisal.getAppraisalId()));
        }

        List<FormCategory> categories = categoryRepo.findByForm_FormId(form.getFormId());
        List<Question> questions = questionRepo.findByCategory_Form_FormId(form.getFormId());

        Map<Long, List<ManagerEvaluationAnswer>> mgrAnswersMap = answerRepo
                .findByEvaluation_EvaluationId(eval.getEvaluationId())
                .stream()
                .collect(Collectors.groupingBy(a -> a.getQuestion().getQuestionId()));

        SelfAssessment self = selfRepo.findByAppraisal_AppraisalId(appraisal.getAppraisalId()).orElse(null);
        Map<Long, List<SelfAssessmentAnswer>> empAnswersMap = java.util.Collections.emptyMap();
        if (self != null) {
            empAnswersMap = selfAnswerRepo.findBySelfAssessment_SelfAssessmentId(self.getSelfAssessmentId())
                    .stream()
                    .collect(Collectors.groupingBy(a -> a.getQuestion().getQuestionId()));
        }

        final Map<Long, List<SelfAssessmentAnswer>> finalEmpAnswersMap = empAnswersMap;

        List<CategoryWithManagerAnswersDTO> categoryDTOs = categories.stream().map(cat -> {
            List<QuestionWithManagerAnswerDTO> questionDTOs = questions.stream()
                    .filter(q -> q.getCategory().getCategoryId().equals(cat.getCategoryId()))
                    .map(q -> {
                        ManagerEvaluationAnswer mgrAns = mgrAnswersMap
                                .getOrDefault(q.getQuestionId(), new ArrayList<>())
                                .stream().findFirst().orElse(null);

                        SelfAssessmentAnswer empAns = finalEmpAnswersMap
                                .getOrDefault(q.getQuestionId(), new ArrayList<>())
                                .stream().findFirst().orElse(null);
                        return QuestionWithManagerAnswerDTO.builder()
                                .questionId(q.getQuestionId())
                                .questionText(q.getQuestionText())
                                .questionType(q.getQuestionType() != null
                                        ? q.getQuestionType().name()
                                        : null)
                                .isRequired(q.getIsRequired())
                                .employeeRatingValue(
                                        empAns != null ? empAns.getRatingValue()
                                                : null)
                                .employeeIsCompleted(
                                        empAns != null ? empAns.getIsCompleted()
                                                : null)
                                .employeeComment(empAns != null ? empAns.getComment()
                                        : null)
                                .answerId(mgrAns != null ? mgrAns.getId() : null)
                                .managerRatingValue(
                                        mgrAns != null ? mgrAns.getRatingValue()
                                                : null)
                                .managerComment(mgrAns != null ? mgrAns.getComment()
                                        : null)
                                .build();
                    }).toList();

            return CategoryWithManagerAnswersDTO.builder()
                    .categoryId(cat.getCategoryId())
                    .categoryName(cat.getCategoryName())
                    .questions(questionDTOs)
                    .build();
        }).toList();

        return FullManagerEvaluationResponse.builder()
                .evaluationId(eval.getEvaluationId())
                .appraisalId(appraisal.getAppraisalId())
                .formName(form.getFormName())
                .formType(form.getFormType())
                .appraisalStatus(appraisal.getStatus().name())
                // Manager Info
                .managerId(appraisal.getManager() != null ? appraisal.getManager().getId() : null)
                .isSelfSubmitted(appraisal.getSelfSubmittedAt() != null)
                // Employee Info
                .employeeName(appraisal.getEmployee().getStaffName())
                .employeeId(appraisal.getEmployee().getId())
                .employeeCode(appraisal.getEmployee().getEmployeeCode())
                .positionName(appraisal.getEmployee().getPosition() != null
                        ? appraisal.getEmployee().getPosition().getPositionName()
                        : null)
                .departmentName(empDeptRepo
                        .findByEmployeeIdAndIsCurrentTrue(appraisal.getEmployee().getId())
                        .map(ed -> ed.getCurrentDepartment() != null
                                ? ed.getCurrentDepartment().getDepartmentName()
                                : null)
                        .orElse(null))

                // Cycle Info
                .cycleStartDate(appraisal.getCycle().getStartDate())
                .cycleEndDate(appraisal.getCycle().getEndDate())
                .selfAssessmentDeadline(appraisal.getCycle().getSelfAssessmentDeadline())
                .managerEvaluationDeadline(appraisal.getCycle().getManagerEvaluationDeadline())
                .totalScore(eval.getTotalScore())

                .submitted(eval.getSubmitted())
                .lastSavedAt(eval.getLastSavedAt())
                .finalComment(eval.getFinalComment())
                .submittedAt(eval.getSubmittedAt())
                .employeeSignedAt(appraisal.getEmployeeSignedAt())
                .managerSignedAt(appraisal.getManagerSignedAt())
                .employeeSignature(appraisal.getEmployeeSignComment())
                .managerSignature(appraisal.getManagerSignComment())
                .categories(categoryDTOs)
                .build();

    }
}
