package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.appraisal.*;
import ace.org.epms_backend.enums.AppraisalStatus;
import ace.org.epms_backend.mapper.AppraisalMapper;
import ace.org.epms_backend.repository.*;
import ace.org.epms_backend.service.AppraisalCalculationService;
import ace.org.epms_backend.service.AppraisalService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import ace.org.epms_backend.model.*;
import ace.org.epms_backend.model.appraisal.*;
import ace.org.epms_backend.model.employee.*;

import ace.org.epms_backend.exception.NotFoundException;


@Service
@RequiredArgsConstructor
public class AppraisalServiceImpl implements AppraisalService {

    private final AppraisalRepository appraisalRepo;
    private final EmployeeRepository employeeRepo;
    private final AppraisalCycleRepository cycleRepo;
    private final AppraisalMapper appraisalMapper;
    private final AppraisalCalculationService calculationService;
    private final SelfAssessmentRepository selfRepo;
    private final SelfAssessmentAnswerRepository selfAnswerRepo;
    private final ManagerEvaluationRepository evalRepo;
    private final ManagerEvaluationAnswerRepository evalAnswerRepo;
    private final QuestionRepository questionRepo;
    private final AppraisalHistoryRepository historyRepo;
    private final AppraisalFormRepository formRepo;
    private final PerformanceCategoryRepository performanceCategoryRepo;
    private final EmployeeDepartmentRepository employeeDeptRepo;

    @Override
    public AppraisalResponse createAppraisal(AppraisalCreateRequest request) {

        Appraisal appraisal = new Appraisal();

        appraisal.setEmployee(
                employeeRepo.findById(request.getEmployeeId())
                        .orElseThrow(() -> new NotFoundException("Employee not found")));

        appraisal.setCycle(
                cycleRepo.findById(request.getCycleId())
                        .orElseThrow(() -> new NotFoundException("Cycle not found")));

        appraisal.setManager(
                employeeRepo.findById(request.getManagerId())
                        .orElseThrow(() -> new NotFoundException("Manager not found")));

        appraisal.setForm(
                formRepo.findById(request.getFormId())
                        .orElseThrow(() -> new NotFoundException("Form not found")));

        if (request.getPerformanceCategoryId() != null) {
            appraisal.setPerformanceCategory(
                    performanceCategoryRepo.findById(request.getPerformanceCategoryId())
                            .orElseThrow(() -> new NotFoundException("Performance Category not found")));
        }

        appraisal.setStatus(AppraisalStatus.PENDING);
        appraisal.setIsLocked(false);

        appraisalRepo.save(appraisal);

        return appraisalMapper.toResponse(appraisal);
    }

    @Override
    public AppraisalResponse assignAppraisal(AppraisalAssignRequest request) {

        Appraisal appraisal = appraisalRepo.findById(request.getAppraisalId())
                .orElseThrow(() -> new RuntimeException("Appraisal not found"));

        if (appraisal.getStatus() == AppraisalStatus.ARCHIVED || Boolean.TRUE.equals(appraisal.getIsLocked())) {
            throw new RuntimeException("Cannot assign manager to an archived or locked appraisal");
        }

        appraisal.setManager(
                employeeRepo.findById(request.getManagerId())
                        .orElseThrow(() -> new RuntimeException("Manager not found")));

        appraisalRepo.save(appraisal);

        return appraisalMapper.toResponse(appraisal);
    }

    @Override
    public AppraisalResponse getById(Long id) {

        Appraisal appraisal = appraisalRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Appraisal not found"));

        return appraisalMapper.toResponse(appraisal);
    }

    // ✅ ADD THIS
    @Override
    public List<AppraisalResponse> getAll() {
        return appraisalRepo.findAll()
                .stream()
                .map(appraisalMapper::toResponse)
                .toList();
    }

    @Override
    public AppraisalResponse calculate(Long id) {

        calculationService.calculateScore(id);

        Appraisal appraisal = appraisalRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Appraisal not found"));

        return appraisalMapper.toResponse(appraisal);
    }

    // ✅ ADD THIS
    @Override
    public AppraisalResponse lock(Long id) {
        Appraisal appraisal = getAppraisalOrThrow(id);
        checkNotLocked(appraisal);

        if (!Boolean.TRUE.equals(appraisal.getEmployeeSigned()) || !Boolean.TRUE.equals(appraisal.getManagerSigned())) {
            throw new RuntimeException("Cannot lock appraisal before both parties have signed off");
        }

        appraisal.setIsLocked(true);
        appraisal.setStatus(AppraisalStatus.ARCHIVED);
        appraisalRepo.save(appraisal);

        // Save to History
        AppraisalHistory history = AppraisalHistory.builder()
                .appraisal(appraisal)
                .employee(appraisal.getEmployee())
                .manager(appraisal.getManager())
                .cycle(appraisal.getCycle())
                .score(appraisal.getTotalScore())
                .grade(appraisal.getPerformanceGrade())
                .isFinal(true)
                .build();
        historyRepo.save(history);

        return appraisalMapper.toResponse(appraisal);
    }

    // ✅ FIXED (now matches interface)
    @Override
    public AppraisalResponse finalizeAppraisal(Long id) {

        Appraisal appraisal = appraisalRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Appraisal not found"));

        appraisal.setStatus(AppraisalStatus.ARCHIVED);
        appraisal.setIsLocked(true);

        appraisalRepo.save(appraisal);

        return appraisalMapper.toResponse(appraisal);
    }

    @Override
    public AppraisalResponse update(Long id, AppraisalUpdateRequest request) {
        Appraisal appraisal = appraisalRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Appraisal not found"));

        if (request.getEmployeeId() != null && !request.getEmployeeId()
                .equals(appraisal.getEmployee() != null ? appraisal.getEmployee().getId() : null)) {
            appraisal.setEmployee(employeeRepo.findById(request.getEmployeeId())
                    .orElseThrow(() -> new RuntimeException("Employee not found")));
        }

        if (request.getCycleId() != null && !request.getCycleId()
                .equals(appraisal.getCycle() != null ? appraisal.getCycle().getCycleId() : null)) {
            appraisal.setCycle(cycleRepo.findById(request.getCycleId())
                    .orElseThrow(() -> new RuntimeException("Cycle not found")));
        }

        if (request.getManagerId() != null && !request.getManagerId()
                .equals(appraisal.getManager() != null ? appraisal.getManager().getId() : null)) {
            appraisal.setManager(employeeRepo.findById(request.getManagerId())
                    .orElseThrow(() -> new RuntimeException("Manager not found")));
        }

        appraisalMapper.updateEntityFromRequest(request, appraisal);

        appraisalRepo.save(appraisal);
        return appraisalMapper.toResponse(appraisal);
    }

    @Override
    public void delete(Long id) {
        Appraisal appraisal = appraisalRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Appraisal not found"));
        appraisalRepo.delete(appraisal);
    }

    @Override
    public List<AppraisalResponse> getByEmployeeId(Long employeeId) {
        return appraisalRepo.findByEmployee_Id(employeeId)
                .stream()
                .map(appraisalMapper::toResponse)
                .toList();
    }

    @Override
    public List<AppraisalResponse> getByManagerId(Long managerId) {
        return appraisalRepo.findByManager_Id(managerId)
                .stream()
                .map(appraisalMapper::toResponse)
                .toList();
    }

    @Override
    public List<AppraisalResponse> getByCycleId(Long cycleId) {
        return appraisalRepo.findByCycle_CycleId(cycleId)
                .stream()
                .map(appraisalMapper::toResponse)
                .toList();
    }

    @Override
    public AppraisalResponse submitSelfAssessment(Long id) {
        Appraisal appraisal = getAppraisalOrThrow(id);
        checkNotLocked(appraisal);
        appraisal.setStatus(AppraisalStatus.SELF_ASSESSED);
        return appraisalMapper.toResponse(appraisalRepo.save(appraisal));
    }

    @Override
    public AppraisalResponse submitManagerEvaluation(Long id) {
        Appraisal appraisal = getAppraisalOrThrow(id);
        checkNotLocked(appraisal);

        if (appraisal.getStatus() != AppraisalStatus.SELF_ASSESSED) {
            throw new RuntimeException("Manager evaluation can only be submitted after self-assessment is completed");
        }

        appraisal.setStatus(AppraisalStatus.EVALUATED);
        return appraisalMapper.toResponse(appraisalRepo.save(appraisal));
    }

    @Override
    public AppraisalResponse employeeSignOff(Long id) {
        Appraisal appraisal = getAppraisalOrThrow(id);
        checkNotLocked(appraisal);

        if (appraisal.getTotalScore() == null) {
            throw new RuntimeException("Cannot sign off before score calculation");
        }

        appraisal.setEmployeeSigned(true);
        return appraisalMapper.toResponse(appraisalRepo.save(appraisal));
    }

    @Override
    public AppraisalResponse managerSignOff(Long id) {
        Appraisal appraisal = getAppraisalOrThrow(id);
        checkNotLocked(appraisal);

        if (appraisal.getTotalScore() == null) {
            throw new RuntimeException("Cannot sign off before score calculation");
        }

        appraisal.setManagerSigned(true);
        return appraisalMapper.toResponse(appraisalRepo.save(appraisal));
    }

    private Appraisal getAppraisalOrThrow(Long id) {
        return appraisalRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Appraisal not found"));
    }

    private void checkNotLocked(Appraisal appraisal) {
        if (Boolean.TRUE.equals(appraisal.getIsLocked()) || appraisal.getStatus() == AppraisalStatus.ARCHIVED) {
            throw new RuntimeException("Cannot modify a locked or archived appraisal");
        }
    }

    @Override
    public AppraisalDetailsResponse getAppraisalDetails(Long id) {
        Appraisal appraisal = getAppraisalOrThrow(id);

        // Employee Info
        String departmentName = employeeDeptRepo.findByEmployeeIdAndIsCurrentTrue(appraisal.getEmployee().getId())
                .map(ed -> ed.getCurrentDepartment() != null ? ed.getCurrentDepartment().getDepartmentName() : null)
                .orElse(null);

        AppraisalDetailsResponse.EmployeeInfo empInfo = AppraisalDetailsResponse.EmployeeInfo.builder()
                .staffName(appraisal.getEmployee().getStaffName())
                .employeeCode(appraisal.getEmployee().getEmployeeCode())
                .department(departmentName)
                .position(appraisal.getEmployee().getPosition() != null
                        ? appraisal.getEmployee().getPosition().getPositionName()
                        : null)
                .build();

        // Get questions for the form
        List<Question> questions = questionRepo.findByCategory_Form_FormId(appraisal.getForm().getFormId());

        // Get assessments
        Optional<SelfAssessment> self = selfRepo.findByAppraisal_AppraisalId(id);
        Optional<ManagerEvaluation> eval = evalRepo.findByAppraisal_AppraisalId(id);

        List<AppraisalDetailsResponse.QuestionDetail> answers = questions.stream().map(q -> {
            AppraisalDetailsResponse.QuestionDetail.QuestionDetailBuilder builder = AppraisalDetailsResponse.QuestionDetail
                    .builder()
                    .questionId(q.getQuestionId())
                    .questionText(q.getQuestionText())
                    .categoryName(q.getCategory() != null ? q.getCategory().getCategoryName() : null);

            if (self.isPresent()) {
                selfAnswerRepo
                        .findBySelfAssessment_SelfAssessmentIdAndQuestion_QuestionId(self.get().getSelfAssessmentId(),
                                q.getQuestionId())
                        .ifPresent(sa -> {
                            builder.selfAnswer(sa.getAnswerValue());
                            builder.selfComment(sa.getComment());
                        });
            }

            if (eval.isPresent()) {
                evalAnswerRepo
                        .findByEvaluation_EvaluationIdAndQuestion_QuestionId(eval.get().getEvaluationId(),
                                q.getQuestionId())
                        .ifPresent(ea -> {
                            builder.managerRating(ea.getRatingValue());
                            builder.managerComment(ea.getComment());
                        });
            }

            return builder.build();
        }).toList();

        return AppraisalDetailsResponse.builder()
                .employee(empInfo)
                .answers(answers)
                .totalScore(appraisal.getTotalScore())
                .grade(appraisal.getPerformanceGrade())
                .status(appraisal.getStatus().name())
                .employeeSigned(appraisal.getEmployeeSigned())
                .managerSigned(appraisal.getManagerSigned())
                .build();
    }
}
