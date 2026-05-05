package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.appraisal.AppraisalSummaryResponse;
import ace.org.epms_backend.mapper.AppraisalSummaryMapper;
import ace.org.epms_backend.repository.AppraisalSummaryRepository;
import ace.org.epms_backend.service.AppraisalSummaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AppraisalSummaryServiceImpl implements AppraisalSummaryService {

    private final AppraisalSummaryRepository summaryRepo;
    private final AppraisalSummaryMapper summaryMapper;

    @Override
    public List<AppraisalSummaryResponse> getByCycleId(Long cycleId) {
        return summaryMapper.toResponseList(summaryRepo.findByCycle_CycleId(cycleId));
    }

    @Override
    public List<AppraisalSummaryResponse> getByEmployeeId(Long employeeId) {
        // Need to add findByEmployee_Id to Repository if it doesn't exist
        return summaryMapper.toResponseList(summaryRepo.findByEmployee_Id(employeeId));
    }
}
