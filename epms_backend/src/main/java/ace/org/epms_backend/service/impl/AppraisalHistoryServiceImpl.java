package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.appraisal.AppraisalHistoryResponse;
import ace.org.epms_backend.model.appraisal.AppraisalHistory;
import ace.org.epms_backend.repository.AppraisalHistoryRepository;
import ace.org.epms_backend.service.AppraisalHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AppraisalHistoryServiceImpl implements AppraisalHistoryService {

    private final AppraisalHistoryRepository historyRepo;

    @Override
    public List<AppraisalHistoryResponse> getAllHistories() {
        return historyRepo.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public AppraisalHistoryResponse getHistoryById(Long id) {
        AppraisalHistory history = historyRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("History not found"));
        return mapToResponse(history);
    }

    @Override
    public List<AppraisalHistoryResponse> getHistoryByEmployee(Long employeeId) {
        return historyRepo.findByEmployee_Id(employeeId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<AppraisalHistoryResponse> getHistoryByCycle(Long cycleId) {
        return historyRepo.findByCycle_CycleId(cycleId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private AppraisalHistoryResponse mapToResponse(AppraisalHistory history) {
        return AppraisalHistoryResponse.builder()
                .historyId(history.getHistoryId())
                .appraisalId(history.getAppraisal() != null ? history.getAppraisal().getAppraisalId() : null)
                .employeeId(history.getEmployee() != null ? history.getEmployee().getId() : null)
                .staffName(history.getEmployee() != null ? history.getEmployee().getStaffName() : null)
                .managerId(history.getManager() != null ? history.getManager().getId() : null)
                .managerName(history.getManager() != null ? history.getManager().getStaffName() : null)
                .cycleId(history.getCycle() != null ? history.getCycle().getCycleId() : null)
                .cycleName(history.getCycle() != null ? history.getCycle().getCycleName() : null)
                .score(history.getScore())
                .grade(history.getGrade())
                .build();
    }
}
