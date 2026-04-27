package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.appraisal.*;
import ace.org.epms_backend.enums.AppraisalStatus;
import ace.org.epms_backend.model.appraisal.*;
import ace.org.epms_backend.repository.*;
import ace.org.epms_backend.service.SelfAssessmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SelfAssessmentServiceImpl implements SelfAssessmentService {

    private final AppraisalRepository appraisalRepo;
    private final SelfAssessmentRepository selfRepo;
    private final SelfAssessmentAnswerRepository answerRepo;
    private final QuestionRepository questionRepo;

    @Override
    @Transactional
    public SelfAssessmentResponse create(SelfAssessmentRequest request) {
        Optional<SelfAssessment> existing = selfRepo.findByAppraisal_AppraisalId(request.getAppraisalId());
        if (existing.isPresent()) {
            return mapToResponse(existing.get());
        }

        Appraisal appraisal = appraisalRepo.findById(request.getAppraisalId())
                .orElseThrow(() -> new RuntimeException("Appraisal not found"));

        SelfAssessment self = SelfAssessment.builder()
                .appraisal(appraisal)
                .build();

        return mapToResponse(selfRepo.save(self));
    }

    @Override
    @Transactional
    public void saveAnswers(Long selfAssessmentId, List<SelfAssessmentAnswerRequest> answers) {
        SelfAssessment self = selfRepo.findById(selfAssessmentId)
                .orElseThrow(() -> new RuntimeException("Self assessment not found"));

        if (self.getSubmittedAt() != null) {
            throw new RuntimeException("Self assessment already submitted and cannot be modified");
        }

        for (SelfAssessmentAnswerRequest req : answers) {
            Question question = questionRepo.findById(req.getQuestionId())
                    .orElseThrow(() -> new RuntimeException("Question not found"));

            Optional<SelfAssessmentAnswer> existingAnswer = answerRepo.findBySelfAssessment_SelfAssessmentIdAndQuestion_QuestionId(selfAssessmentId, req.getQuestionId());

            SelfAssessmentAnswer answer;
            if (existingAnswer.isPresent()) {
                answer = existingAnswer.get();
                answer.setAnswerValue(req.getAnswerValue());
                answer.setComment(req.getComment());
            } else {
                answer = SelfAssessmentAnswer.builder()
                        .selfAssessment(self)
                        .question(question)
                        .answerValue(req.getAnswerValue())
                        .comment(req.getComment())
                        .isCompleted(true)
                        .build();
            }
            answerRepo.save(answer);
        }
    }

    @Override
    public List<SelfAssessmentAnswerResponse> getAnswers(Long selfAssessmentId) {
        return answerRepo.findBySelfAssessment_SelfAssessmentId(selfAssessmentId)
                .stream()
                .map(this::mapToAnswerResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void submitFinal(Long selfAssessmentId) {
        SelfAssessment self = selfRepo.findById(selfAssessmentId)
                .orElseThrow(() -> new RuntimeException("Self assessment not found"));

        if (self.getSubmittedAt() != null) {
            throw new RuntimeException("Self assessment already submitted");
        }

        self.setSubmittedAt(Instant.now());
        selfRepo.save(self);

        Appraisal appraisal = self.getAppraisal();
        appraisal.setStatus(AppraisalStatus.SELF_ASSESSED);
        appraisalRepo.save(appraisal);
    }

    @Override
    @Transactional
    public void submitSelfAssessment(SelfAssessmentSubmitRequest request) {
        // Legacy support
        SelfAssessmentResponse res = create(new SelfAssessmentRequest() {{ setAppraisalId(request.getAppraisalId()); }});
        List<SelfAssessmentAnswerRequest> answers = request.getAnswers().stream().map(a -> {
            SelfAssessmentAnswerRequest sar = new SelfAssessmentAnswerRequest();
            sar.setQuestionId(a.getQuestionId());
            sar.setAnswerValue(a.getAnswerValue());
            sar.setComment(a.getComment());
            return sar;
        }).collect(Collectors.toList());
        
        saveAnswers(res.getSelfAssessmentId(), answers);
        submitFinal(res.getSelfAssessmentId());
    }

    private SelfAssessmentResponse mapToResponse(SelfAssessment self) {
        return SelfAssessmentResponse.builder()
                .selfAssessmentId(self.getSelfAssessmentId())
                .appraisalId(self.getAppraisal().getAppraisalId())
                .submittedAt(self.getSubmittedAt())
                .build();
    }

    private SelfAssessmentAnswerResponse mapToAnswerResponse(SelfAssessmentAnswer answer) {
        return SelfAssessmentAnswerResponse.builder()
                .id(answer.getId())
                .questionId(answer.getQuestion().getQuestionId())
                .questionText(answer.getQuestion().getQuestionText())
                .answerValue(answer.getAnswerValue())
                .comment(answer.getComment())
                .build();
    }
}
