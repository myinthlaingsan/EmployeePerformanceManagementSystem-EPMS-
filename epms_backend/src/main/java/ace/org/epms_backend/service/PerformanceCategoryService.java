package ace.org.epms_backend.service;
 
import ace.org.epms_backend.dto.appraisal.PerformanceCategoryRequest;
import ace.org.epms_backend.dto.appraisal.PerformanceCategoryResponse;
 
import java.util.List;
 
public interface PerformanceCategoryService {
    PerformanceCategoryResponse create(PerformanceCategoryRequest request);
    PerformanceCategoryResponse update(Long id, PerformanceCategoryRequest request);
    void delete(Long id);
    PerformanceCategoryResponse getById(Long id);
    List<PerformanceCategoryResponse> getAll();
}
