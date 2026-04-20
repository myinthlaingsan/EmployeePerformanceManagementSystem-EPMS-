package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.appraisal.SelfAssessmentSubmitRequest;
import ace.org.epms_backend.enums.AppraisalStatus;
import ace.org.epms_backend.model.appraisal.*;
import ace.org.epms_backend.repository.*;
import ace.org.epms_backend.service.SelfAssessmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class SelfAssessmentServiceImpl implements SelfAssessmentService {

    private final AppraisalRepository appraisalRepo;
    private final SelfAssessmentRepository selfRepo;
    private final SelfAssessmentAnswerRepository answerRepo;
    private final QuestionRepository questionRepo;

    @Override
    public void submitSelfAssessment(SelfAssessmentSubmitRequest request) {

        Appraisal appraisal = appraisalRepo.findById(request.getAppraisalId())
                .orElseThrow(() -> new RuntimeException("Appraisal not found"));

        // create self assessment
        SelfAssessment self = SelfAssessment.builder()
                .appraisal(appraisal)
                .submittedAt(Instant.now())
                .build();

        self = selfRepo.save(self);

        // save answers
        for (SelfAssessmentSubmitRequest.SelfAnswerDTO req : request.getAnswers()) {

            Question question = questionRepo.findById(req.getQuestionId())
                    .orElseThrow(() -> new RuntimeException("Question not found"));

            SelfAssessmentAnswer answer = SelfAssessmentAnswer.builder()
                    .selfAssessment(self)
                    .question(question)
                    .answerValue(req.getAnswerValue())
                    .comment(req.getComment())
                    .isCompleted(true)
                    .build();

            answerRepo.save(answer);
        }

        // update status
        appraisal.setStatus(AppraisalStatus.SELF_ASSESSED);
        appraisalRepo.save(appraisal);
    }
}
