package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.appraisal.AppraisalCycleRequest;
import ace.org.epms_backend.dto.appraisal.AppraisalCycleResponse;

import java.util.List;

public interface AppraisalCycleService {
    AppraisalCycleResponse create(AppraisalCycleRequest request);
    List<AppraisalCycleResponse> getAll();
    AppraisalCycleResponse getById(Long id);
    AppraisalCycleResponse update(Long id, AppraisalCycleRequest request);
    void delete(Long id);
    AppraisalCycleResponse activate(Long id);
    AppraisalCycleResponse close(Long id);
    AppraisalCycleResponse getActiveCycle();
}

