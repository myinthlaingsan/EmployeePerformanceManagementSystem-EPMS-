package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.AuditRequest;
import ace.org.epms_backend.dto.appraisal.*;
import ace.org.epms_backend.dto.notification.NotificationEvent;
import ace.org.epms_backend.enums.*;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.mapper.SelfAssessmentMapper;
import ace.org.epms_backend.model.appraisal.*;
import ace.org.epms_backend.repository.*;
import ace.org.epms_backend.service.AuditService;
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
public class SelfAssessmentServiceImpl implements SelfAssessmentService {

    private final AppraisalRepository appraisalRepo;
    private final SelfAssessmentRepository selfRepo;
    private final SelfAssessmentAnswerRepository answerRepo;
    private final QuestionRepository questionRepo;
    private final FormCategoryRepository categoryRepo;
    private final SelfAssessmentMapper selfMapper;
    private final EmployeeDepartmentRepository empDeptRepo;
    private final AuditService auditService;

    private final ApplicationEventPublisher eventPublisher;

    @Override
    public FullSelfAssessmentResponse getMyAssessmentForm(Long appraisalId) {
        Appraisal appraisal = appraisalRepo.findById(appraisalId)
                .orElseThrow(() -> new NotFoundException("Appraisal not found"));

        SelfAssessment self = selfRepo.findByAppraisal_AppraisalId(appraisalId)
                .orElseGet(() -> {
                    SelfAssessment newSelf = new SelfAssessment();
                    newSelf.setAppraisal(appraisal);
                    newSelf.setSubmitted(false);
                    return selfRepo.save(newSelf);
                });

        return buildFullResponse(appraisal, self);
    }

    @Override
    @Transactional
    public void saveAnswers(Long selfAssessmentId, List<SelfAssessmentAnswerRequest> answers) {
        SelfAssessment self = selfRepo.findById(selfAssessmentId)
                .orElseThrow(() -> new NotFoundException("Self assessment not found"));

        if (Boolean.TRUE.equals(self.getSubmitted())) {
            throw new RuntimeException("Cannot modify a submitted self-assessment");
        }

        for (SelfAssessmentAnswerRequest req : answers) {
            Question question = questionRepo.findById(req.getQuestionId())
                    .orElseThrow(() -> new NotFoundException("Question not found: " + req.getQuestionId()));

            SelfAssessmentAnswer answer = answerRepo.findBySelfAssessment_SelfAssessmentIdAndQuestion_QuestionId(
                            selfAssessmentId, req.getQuestionId())
                    .orElseGet(() -> {
                        SelfAssessmentAnswer newAnswer = new SelfAssessmentAnswer();
                        newAnswer.setSelfAssessment(self);
                        newAnswer.setQuestion(question);
                        return newAnswer;
                    });

            answer.setRatingValue(req.getRatingValue());
            answer.setIsCompleted(req.getIsCompleted());
            answer.setComment(req.getComment());
            answerRepo.save(answer);
        }
    }

    @Override
    @Transactional
    public void saveDraft(Long selfAssessmentId) {
        SelfAssessment self = selfRepo.findById(selfAssessmentId)
                .orElseThrow(() -> new NotFoundException("Self assessment not found"));

        self.setLastSavedAt(Instant.now());
        selfRepo.save(self);
    }

    @Override
    @Transactional
    public void submitFinal(Long selfAssessmentId) {
        SelfAssessment self = selfRepo.findById(selfAssessmentId)
                .orElseThrow(() -> new NotFoundException("Self assessment not found"));

        if (Boolean.TRUE.equals(self.getSubmitted())) {
            throw new RuntimeException("Self-assessment is already submitted");
        }

        // Calculate total score (sum of ratings)
        List<SelfAssessmentAnswer> answers = answerRepo.findBySelfAssessment_SelfAssessmentId(selfAssessmentId);
        BigDecimal totalScore = BigDecimal.ZERO;
        for (SelfAssessmentAnswer ans : answers) {
            if (ans.getRatingValue() != null) {
                totalScore = totalScore.add(BigDecimal.valueOf(ans.getRatingValue()));
            }
        }

        self.setTotalScore(totalScore);
        self.setSubmitted(true);
        self.setSubmittedAt(Instant.now());
        selfRepo.save(self);

        // Update Appraisal status
        Appraisal appraisal = self.getAppraisal();
        appraisal.setStatus(AppraisalStatus.SELF_ASSESSED);
        appraisal.setSelfSubmittedAt(Instant.now());
        appraisalRepo.save(appraisal);

        // Notify Manager
        eventPublisher.publishEvent(NotificationEvent.builder()
                .recipientId(appraisal.getManager().getId())
                .type(NotificationType.SELF_ASSESSMENT_SUBMITTED)
                .title("Self Assessment Submitted")
                .message(appraisal.getEmployee().getStaffName() + " has submitted their self-assessment.")
                .referenceType(ReferenceType.APPRAISAL)
                .referenceId(appraisal.getAppraisalId())
                .build());

        // Log Audit
        auditService.log(AuditRequest.builder()
                .tableName("self_assessments")
                .recordId(selfAssessmentId)
                .action(AuditAction.UPDATE)
                .newState(self)
                .status(AuditStatus.SUCCESS)
                .build());
    }

    @Override
    public List<SelfAssessmentResponse> getMyAssessments(Long employeeId) {
        return appraisalRepo.findByEmployee_Id(employeeId).stream()
                .map(a -> selfRepo.findByAppraisal_AppraisalId(a.getAppraisalId()))
                .filter(java.util.Optional::isPresent)
                .map(opt -> selfMapper.toResponse(opt.get()))
                .collect(Collectors.toList());
    }

    private FullSelfAssessmentResponse buildFullResponse(Appraisal appraisal, SelfAssessment self) {
        // Use the specific form linked to the appraisal
        AppraisalForm form = appraisal.getForm();
        
        if (form == null) {
            // Fallback: Find the first SELF_ASSESSMENT form in the cycle if none linked (backward compatibility)
            form = appraisal.getCycle().getForms().stream()
                .filter(f -> f.getFormType() == FormType.SELF_ASSESSMENT)
                .findFirst()
                .orElseThrow(() -> new NotFoundException("No SELF_ASSESSMENT form found for appraisal: " 
                        + appraisal.getAppraisalId()));
        }

        List<FormCategory> categories = categoryRepo.findByForm_FormId(form.getFormId());

        List<Question> questions = questionRepo.findByCategory_Form_FormId(form.getFormId());


        Map<Long, List<SelfAssessmentAnswer>> answersMap = answerRepo
                .findBySelfAssessment_SelfAssessmentId(self.getSelfAssessmentId())
                .stream()
                .collect(Collectors.groupingBy(a -> a.getQuestion().getQuestionId()));

        List<CategoryWithAnswersDTO> categoryDTOs = categories.stream().map(cat -> {
            List<QuestionWithAnswerDTO> questionDTOs = questions.stream()
                    .filter(q -> q.getCategory().getCategoryId().equals(cat.getCategoryId()))
                    .map(q -> {
                        SelfAssessmentAnswer ans = answersMap.getOrDefault(q.getQuestionId(), new ArrayList<>())
                                .stream().findFirst().orElse(null);

                        return QuestionWithAnswerDTO.builder()
                                .questionId(q.getQuestionId())
                                .questionText(q.getQuestionText())
                                .questionType(q.getQuestionType() != null ? q.getQuestionType().name() : null)
                                .secondaryQuestionType(q.getSecondaryQuestionType() != null ? q.getSecondaryQuestionType().name() : null)
                                .isRequired(q.getIsRequired())
                                .answerId(ans != null ? ans.getId() : null)
                                .ratingValue(ans != null ? ans.getRatingValue() : null)
                                .isCompleted(ans != null ? ans.getIsCompleted() : null)
                                .comment(ans != null ? ans.getComment() : null)
                                .build();
                    }).toList();

            return CategoryWithAnswersDTO.builder()
                    .categoryId(cat.getCategoryId())
                    .categoryName(cat.getCategoryName())
                    .questions(questionDTOs)
                    .build();
        }).toList();

        return FullSelfAssessmentResponse.builder()
                .selfAssessmentId(self.getSelfAssessmentId())
                .appraisalId(appraisal.getAppraisalId())
                .formName(form.getFormName())
                .formType(form.getFormType())
                // Employee Info
                .employeeId(appraisal.getEmployee().getId())
                .employeeName(appraisal.getEmployee().getStaffName())
                .employeeCode(appraisal.getEmployee().getEmployeeCode())
                .positionName(appraisal.getEmployee().getPosition() != null
                        ? appraisal.getEmployee().getPosition().getPositionName()
                        : null)
                .departmentName(empDeptRepo.findByEmployeeIdAndIsCurrentTrue(appraisal.getEmployee().getId())
                        .map(ed -> ed.getCurrentDepartment() != null ? ed.getCurrentDepartment().getDepartmentName() : null)
                        .orElse(null))
                .managerName(appraisal.getManager() != null ? appraisal.getManager().getStaffName() : "N/A")

                // Cycle Info
                .cycleStartDate(appraisal.getCycle().getStartDate())
                .cycleEndDate(appraisal.getCycle().getEndDate())
                .selfAssessmentDeadline(appraisal.getCycle().getSelfAssessmentDeadline())
                .managerEvaluationDeadline(appraisal.getCycle().getManagerEvaluationDeadline())
                .totalScore(self.getTotalScore())

                .submitted(self.getSubmitted())
                .lastSavedAt(self.getLastSavedAt())
                .submittedAt(self.getSubmittedAt())
                .employeeSignedAt(appraisal.getEmployeeSignedAt())
                .managerSignedAt(appraisal.getManagerSignedAt())
                .employeeSignature(appraisal.getEmployeeSignComment() != null 
                    ? java.util.Base64.getEncoder().encodeToString(appraisal.getEmployeeSignComment()) 
                    : null)
                .categories(categoryDTOs)
                .build();
    }
}
