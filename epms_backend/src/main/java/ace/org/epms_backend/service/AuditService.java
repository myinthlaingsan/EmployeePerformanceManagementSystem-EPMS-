package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.AuditRequest;

public interface AuditService {
    void log(AuditRequest request);
}
