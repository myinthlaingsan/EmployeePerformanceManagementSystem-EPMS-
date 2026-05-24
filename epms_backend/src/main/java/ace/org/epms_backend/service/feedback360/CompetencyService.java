package ace.org.epms_backend.service.feedback360;

import ace.org.epms_backend.dto.feedback360.CompetencyRequest;
import ace.org.epms_backend.dto.feedback360.CompetencyResponse;

import java.util.List;

public interface CompetencyService {

    List<CompetencyResponse> getAllActive();

    CompetencyResponse create(CompetencyRequest request);

    CompetencyResponse update(Long id, CompetencyRequest request);

    void delete(Long id);
}
