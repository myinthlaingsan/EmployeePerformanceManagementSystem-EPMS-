package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.pip.PipCreateRequest;
import ace.org.epms_backend.dto.pip.PipResponse;

import java.time.LocalDate;
import java.util.List;

public interface PipService {

    PipResponse createPip(PipCreateRequest request);

    PipResponse getPipById(Long id);

    List<PipResponse> getAllPips();

    List<PipResponse> getPipsByEmployee(Long employeeId);

    List<PipResponse> getPipsByInvolvedUser(Long userId);

    void activatePip(Long id);

    PipResponse extendPip(Long id, LocalDate newEndDate);

    void deletePip(Long id);
}