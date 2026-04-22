package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.appraisal.*;
import ace.org.epms_backend.enums.AppraisalStatus;
import ace.org.epms_backend.mapper.AppraisalMapper;
import ace.org.epms_backend.model.appraisal.Appraisal;
import ace.org.epms_backend.repository.*;
import ace.org.epms_backend.service.AppraisalCalculationService;
import ace.org.epms_backend.service.AppraisalService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AppraisalServiceImpl implements AppraisalService {

    private final AppraisalRepository appraisalRepo;
    private final EmployeeRepository employeeRepo;
    private final AppraisalCycleRepository cycleRepo;
    private final AppraisalMapper appraisalMapper;
    private final AppraisalCalculationService calculationService;

    @Override
    public AppraisalResponse createAppraisal(AppraisalCreateRequest request) {

        Appraisal appraisal = new Appraisal();

        appraisal.setEmployee(
                employeeRepo.findById(request.getEmployeeId())
                        .orElseThrow(() -> new RuntimeException("Employee not found"))
        );

        appraisal.setCycle(
                cycleRepo.findById(request.getCycleId())
                        .orElseThrow(() -> new RuntimeException("Cycle not found"))
        );

        appraisal.setStatus(AppraisalStatus.PENDING);
        appraisal.setIsLocked(false);

        appraisalRepo.save(appraisal);

        return appraisalMapper.toResponse(appraisal);
    }

    @Override
    public AppraisalResponse assignAppraisal(AppraisalAssignRequest request) {

        Appraisal appraisal = appraisalRepo.findById(request.getAppraisalId())
                .orElseThrow(() -> new RuntimeException("Appraisal not found"));

        appraisal.setManager(
                employeeRepo.findById(request.getManagerId())
                        .orElseThrow(() -> new RuntimeException("Manager not found"))
        );

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

        Appraisal appraisal = appraisalRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Appraisal not found"));

        appraisal.setIsLocked(true);

        appraisalRepo.save(appraisal);

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
}
