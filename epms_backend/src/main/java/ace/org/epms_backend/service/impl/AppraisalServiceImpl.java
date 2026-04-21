package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.appraisal.AppraisalAssignRequest;
import ace.org.epms_backend.dto.appraisal.AppraisalCreateRequest;
import ace.org.epms_backend.enums.AppraisalStatus;
import ace.org.epms_backend.model.appraisal.Appraisal;
import ace.org.epms_backend.repository.AppraisalCycleRepository;
import ace.org.epms_backend.repository.AppraisalRepository;
import ace.org.epms_backend.repository.EmployeeRepository;
import ace.org.epms_backend.service.AppraisalService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AppraisalServiceImpl implements AppraisalService {

    private final AppraisalRepository appraisalRepo;
    private final EmployeeRepository employeeRepo;
    private final AppraisalCycleRepository cycleRepo;

    // ✅ CREATE
    @Override
    public void createAppraisal(AppraisalCreateRequest request) {

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
    }

    // ✅ ASSIGN MANAGER
    @Override
    public void assignAppraisal(AppraisalAssignRequest request) {

        Appraisal appraisal = appraisalRepo.findById(request.getAppraisalId())
                .orElseThrow(() -> new RuntimeException("Appraisal not found"));

        appraisal.setManager(
                employeeRepo.findById(request.getManagerId())
                        .orElseThrow(() -> new RuntimeException("Manager not found"))
        );

        appraisalRepo.save(appraisal);
    }

    // ✅ GET (for testing / frontend)
    @Override
    public Appraisal getAppraisal(Long id) {
        return appraisalRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Appraisal not found"));
    }

    // ✅ FINALIZE (your existing logic)
    @Override
    public void finalizeAppraisal(Long appraisalId) {

        Appraisal appraisal = appraisalRepo.findById(appraisalId)
                .orElseThrow(() -> new RuntimeException("Appraisal not found"));

        appraisal.setStatus(AppraisalStatus.ARCHIVED);
        appraisal.setIsLocked(true);

        appraisalRepo.save(appraisal);
    }
}
