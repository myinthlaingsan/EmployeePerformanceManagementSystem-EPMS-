package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.model.PerformanceCategory;
import ace.org.epms_backend.model.appraisal.Appraisal;
import ace.org.epms_backend.model.appraisal.ManagerEvaluation;
import ace.org.epms_backend.model.appraisal.ManagerEvaluationAnswer;
import ace.org.epms_backend.repository.*;
import ace.org.epms_backend.repository.*;
import ace.org.epms_backend.service.AppraisalCalculationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;


@Service
@RequiredArgsConstructor
public class AppraisalCalculationServiceImpl implements AppraisalCalculationService {

    private final AppraisalRepository appraisalRepo;
    private final ManagerEvaluationRepository evaluationRepo;
    private final ManagerEvaluationAnswerRepository answerRepo;
    private final PerformanceCategoryRepository categoryRepo;

    @Override
    public void calculateScore(Long appraisalId) {

        Appraisal appraisal = appraisalRepo.findById(appraisalId)
                .orElseThrow(() -> new RuntimeException("Appraisal not found"));

        ManagerEvaluation evaluation = evaluationRepo
                .findByAppraisal_AppraisalId(appraisalId)
                .orElseThrow(() -> new RuntimeException("Evaluation not found"));

        List<ManagerEvaluationAnswer> answers =
                answerRepo.findByEvaluation_EvaluationId(evaluation.getEvaluationId());

        BigDecimal total = BigDecimal.ZERO;

        for (ManagerEvaluationAnswer ans : answers) {
            total = total.add(BigDecimal.valueOf(ans.getRatingValue()));
        }

        if (answers.isEmpty()) {
            return;
        }

        BigDecimal avg = total.divide(BigDecimal.valueOf(answers.size()), 2, RoundingMode.HALF_UP);


        // find category
        PerformanceCategory category = categoryRepo.findAll().stream()
                .filter(c -> avg.compareTo(c.getMinScore()) >= 0 &&
                        avg.compareTo(c.getMaxScore()) <= 0)
                .findFirst()
                .orElse(null);

        appraisal.setFormScore(avg);
        appraisal.setPerformanceCategory(category);
        if (category != null) {
            appraisal.setPerformanceGrade(category.getName());
        }

        appraisalRepo.save(appraisal);
    }
}
