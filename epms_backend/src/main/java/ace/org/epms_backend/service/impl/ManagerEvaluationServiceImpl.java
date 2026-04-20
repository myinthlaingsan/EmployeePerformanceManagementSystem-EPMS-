package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.appraisal.ManagerEvaluationRequest;
import ace.org.epms_backend.enums.AppraisalStatus;
import ace.org.epms_backend.model.appraisal.*;
import ace.org.epms_backend.repository.*;
import ace.org.epms_backend.service.ManagerEvaluationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class ManagerEvaluationServiceImpl implements ManagerEvaluationService {

    private final AppraisalRepository appraisalRepo;
    private final ManagerEvaluationRepository evaluationRepo;
    private final ManagerEvaluationAnswerRepository answerRepo;
    private final QuestionRepository questionRepo;

    @Override
    public void submitEvaluation(ManagerEvaluationRequest request) {

        Appraisal appraisal = appraisalRepo.findById(request.getAppraisalId())
                .orElseThrow(() -> new RuntimeException("Appraisal not found"));

        // create evaluation
        ManagerEvaluation evaluation = ManagerEvaluation.builder()
                .appraisal(appraisal)
                .submittedAt(Instant.now())
                .build();

        evaluation = evaluationRepo.save(evaluation);

        // save answers
        for (ManagerEvaluationRequest.ManagerAnswerDTO req : request.getAnswers()) {

            Question question = questionRepo.findById(req.getQuestionId())
                    .orElseThrow(() -> new RuntimeException("Question not found"));

            ManagerEvaluationAnswer answer = ManagerEvaluationAnswer.builder()
                    .evaluation(evaluation)
                    .question(question)
                    .ratingValue(req.getRatingValue())
                    .comment(req.getComment())
                    .build();

            answerRepo.save(answer);
        }

        // update status
        appraisal.setStatus(AppraisalStatus.EVALUATED);
        appraisalRepo.save(appraisal);
    }
}
