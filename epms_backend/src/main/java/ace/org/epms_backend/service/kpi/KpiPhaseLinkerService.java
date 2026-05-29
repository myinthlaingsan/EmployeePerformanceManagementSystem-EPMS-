package ace.org.epms_backend.service.kpi;

import ace.org.epms_backend.enums.PhaseStatus;
import ace.org.epms_backend.model.kpi.KpiFinalScore;
import ace.org.epms_backend.model.kpi.KpiGoalPhase;
import ace.org.epms_backend.model.kpi.KpiGoals;
import ace.org.epms_backend.repository.KpiFinalScoreRepository;
import ace.org.epms_backend.repository.KpiGoalPhaseRepository;
import ace.org.epms_backend.repository.KpiGoalsRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import ace.org.epms_backend.exception.NotFoundException;

import java.time.Instant;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class KpiPhaseLinkerService {
    
    private final KpiGoalPhaseRepository phaseRepository;
    private final KpiGoalsRepository goalsRepository;
    private final KpiFinalScoreRepository finalScoreRepository;
    
    @Transactional
    public void assignGoalSetToOpenPhase(Long employeeId, Long cycleId, Long goalSetId) {
        // Find open phase for this employee and cycle
        Optional<KpiGoalPhase> openPhaseOpt = phaseRepository
                .findByEmployee_IdAndCycle_CycleIdAndStatus(employeeId, cycleId, PhaseStatus.OPEN);

        if (openPhaseOpt.isPresent()) {
            KpiGoalPhase openPhase = openPhaseOpt.get();
            // Only link if the phase doesn't already have a goal set
            if (openPhase.getGoalSet() == null) {
                KpiGoals goalSet = goalsRepository.findById(goalSetId)
                        .orElseThrow(() -> new NotFoundException("Goal set not found with id: " + goalSetId));
                openPhase.setGoalSet(goalSet);
                phaseRepository.save(openPhase);

                // CRITICAL: Update KpiFinalScore to point to the new active goal set
                updateFinalScoreReference(employeeId, cycleId, goalSet);
            }
        }
        // If no open phase exists, do nothing – normal assignment without midcycle split
         
    }

    /**
     * Updates the KpiFinalScore to reference the new active goal set.
     * This ensures future score calculations use the correct KPIs.
     */
    private void updateFinalScoreReference(Long employeeId, Long cycleId, KpiGoals newGoalSet) {
        Optional<KpiFinalScore> existingFinalScore = finalScoreRepository
                .findByEmployee_IdAndGoalSet_Cycle_CycleId(employeeId, cycleId);
        
        if (existingFinalScore.isPresent()) {
            KpiFinalScore finalScore = existingFinalScore.get();
            finalScore.setGoalSet(newGoalSet);
            finalScore.setCalculatedAt(Instant.now());
            finalScoreRepository.save(finalScore);
            
        }
        // If no KpiFinalScore exists yet, it will be created when calculateFinalScore is called
    }
}
