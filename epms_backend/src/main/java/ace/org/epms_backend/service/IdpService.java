package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.idp.IdpCreateRequest;
import ace.org.epms_backend.dto.idp.IdpResponse;
import ace.org.epms_backend.dto.idp.IdpUpdateRequest;

import java.util.List;

public interface IdpService {
    IdpResponse createIdp(IdpCreateRequest request);
    IdpResponse updateIdp(Long id, IdpUpdateRequest request);
    IdpResponse getById(Long id);
    List<IdpResponse> getAll();
    List<IdpResponse> getByEmployee(Long employeeId);
    List<IdpResponse> getByInvolvedUser(Long userId);
    IdpResponse activate(Long id);
    IdpResponse complete(Long id);
    IdpResponse cancel(Long id);
    void delete(Long id);
}
