package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.org.PositionRequest;
import ace.org.epms_backend.dto.org.PositionResponse;

import java.util.List;

public interface PositionService {
    PositionResponse createPosition(PositionRequest request);

    List<PositionResponse> getAllPositions();

    List<PositionResponse> getPositionsByLevelId(Long levelId);

    PositionResponse getPositionById(Long id);

    PositionResponse updatePosition(Long id, PositionRequest request);

    void deletePosition(Long id);
    List<PositionResponse> getPositionsByDepartment(Long departmentId);
}
