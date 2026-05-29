package ace.org.epms_backend.service.kpi;

import ace.org.epms_backend.enums.PhaseStatus;
import ace.org.epms_backend.model.kpi.KpiGoalPhase;
import ace.org.epms_backend.model.kpi.KpiGoals;
import ace.org.epms_backend.repository.KpiGoalPhaseRepository;
import ace.org.epms_backend.repository.KpiGoalsRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import ace.org.epms_backend.exception.NotFoundException;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class KpiPhaseLinkerService {
    
    private final KpiGoalPhaseRepository phaseRepository;
    private final KpiGoalsRepository goalsRepository;
    
    
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
            }
        }
        // If no open phase exists, do nothing – normal assignment without midcycle
        // split
    }
}
