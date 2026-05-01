package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.appraisal.*;
import ace.org.epms_backend.enums.AppraisalStatus;
import ace.org.epms_backend.model.appraisal.*;
import ace.org.epms_backend.repository.*;
import ace.org.epms_backend.service.ManagerEvaluationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ManagerEvaluationServiceImpl implements ManagerEvaluationService {

    private final AppraisalRepository appraisalRepo;
    private final ManagerEvaluationRepository evaluationRepo;
    private final ManagerEvaluationAnswerRepository answerRepo;
    private final QuestionRepository questionRepo;

    @Override
    @Transactional
    public ManagerEvaluationResponse create(ManagerEvaluationCreateRequest request) {
        Optional<ManagerEvaluation> existing = evaluationRepo.findByAppraisal_AppraisalId(request.getAppraisalId());
        if (existing.isPresent()) {
            return mapToResponse(existing.get());
        }

        Appraisal appraisal = appraisalRepo.findById(request.getAppraisalId())
                .orElseThrow(() -> new RuntimeException("Appraisal not found"));

        ManagerEvaluation evaluation = ManagerEvaluation.builder()
                .appraisal(appraisal)
                .build();

        return mapToResponse(evaluationRepo.save(evaluation));
    }

    @Override
    @Transactional
    public void saveAnswers(Long evaluationId, List<ManagerEvaluationAnswerRequest> answers) {
        ManagerEvaluation evaluation = evaluationRepo.findById(evaluationId)
                .orElseThrow(() -> new RuntimeException("Manager evaluation not found"));

        if (evaluation.getSubmittedAt() != null) {
            throw new RuntimeException("Evaluation already submitted and cannot be modified");
        }

        for (ManagerEvaluationAnswerRequest req : answers) {
            Question question = questionRepo.findById(req.getQuestionId())
                    .orElseThrow(() -> new RuntimeException("Question not found"));

            Optional<ManagerEvaluationAnswer> existingAnswer = answerRepo.findByEvaluation_EvaluationIdAndQuestion_QuestionId(evaluationId, req.getQuestionId());

            ManagerEvaluationAnswer answer;
            if (existingAnswer.isPresent()) {
                answer = existingAnswer.get();
                answer.setRatingValue(req.getRatingValue());
                answer.setComment(req.getComment());
            } else {
                answer = ManagerEvaluationAnswer.builder()
                        .evaluation(evaluation)
                        .question(question)
                        .ratingValue(req.getRatingValue())
                        .comment(req.getComment())
                        .build();
            }
            answerRepo.save(answer);
        }
    }

    @Override
    public List<ManagerEvaluationAnswerResponse> getAnswers(Long evaluationId) {
        return answerRepo.findByEvaluation_EvaluationId(evaluationId)
                .stream()
                .map(this::mapToAnswerResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void submitFinal(Long evaluationId) {
        ManagerEvaluation evaluation = evaluationRepo.findById(evaluationId)
                .orElseThrow(() -> new RuntimeException("Manager evaluation not found"));

        if (evaluation.getSubmittedAt() != null) {
            throw new RuntimeException("Evaluation already submitted");
        }

        evaluation.setSubmittedAt(Instant.now());
        evaluationRepo.save(evaluation);

        Appraisal appraisal = evaluation.getAppraisal();
        appraisal.setStatus(AppraisalStatus.EVALUATED);
        appraisalRepo.save(appraisal);
    }

    @Override
    @Transactional
    public void submitEvaluation(ManagerEvaluationRequest request) {
        // Legacy support
        ManagerEvaluationResponse res = create(new ManagerEvaluationCreateRequest() {{ setAppraisalId(request.getAppraisalId()); }});
        List<ManagerEvaluationAnswerRequest> answers = request.getAnswers().stream().map(a -> {
            ManagerEvaluationAnswerRequest mar = new ManagerEvaluationAnswerRequest();
            mar.setQuestionId(a.getQuestionId());
            mar.setRatingValue(a.getRatingValue());
            mar.setComment(a.getComment());
            return mar;
        }).collect(Collectors.toList());

        saveAnswers(res.getEvaluationId(), answers);
        submitFinal(res.getEvaluationId());
    }

    private ManagerEvaluationResponse mapToResponse(ManagerEvaluation evaluation) {
        return ManagerEvaluationResponse.builder()
                .evaluationId(evaluation.getEvaluationId())
                .appraisalId(evaluation.getAppraisal().getAppraisalId())
                .submittedAt(evaluation.getSubmittedAt())
                .build();
    }

    private ManagerEvaluationAnswerResponse mapToAnswerResponse(ManagerEvaluationAnswer answer) {
        return ManagerEvaluationAnswerResponse.builder()
                .id(answer.getId())
                .questionId(answer.getQuestion().getQuestionId())
                .questionText(answer.getQuestion().getQuestionText())
                .ratingValue(answer.getRatingValue())
                .comment(answer.getComment())
                .build();
    }
}
