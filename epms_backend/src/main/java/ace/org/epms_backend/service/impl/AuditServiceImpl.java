package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.AuditRequest;
import ace.org.epms_backend.model.AuditLog;
import ace.org.epms_backend.repository.AuditLogRepository;
import ace.org.epms_backend.service.AuditService;
import ace.org.epms_backend.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class AuditServiceImpl implements AuditService {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;
//    private final HttpServletRequest httpServletRequest;
    private final AuthService authService;

    @Override
//    @Async
    public void log(AuditRequest auditRequest) {
        try {
            String oldValues = auditRequest.getOldState() != null 
                    ? objectMapper.writeValueAsString(auditRequest.getOldState()) : null;
            String newValues = auditRequest.getNewState() != null 
                    ? objectMapper.writeValueAsString(auditRequest.getNewState()) : null;

            AuditLog log = AuditLog.builder()
                    .tableName(auditRequest.getTableName())
                    .recordId(auditRequest.getRecordId())
                    .action(auditRequest.getAction())
                    .oldValues(oldValues)
                    .newValues(newValues)
                    .status(auditRequest.getStatus())
                    .changedAt(Instant.now())
                    .ipAddress(auditRequest.getIpAddress())
                    .userAgent(auditRequest.getUserAgent())
                    .changedBy(authService.getCurrentUser())
                    .build();
            auditLogRepository.save(log);
        } catch (Exception e) {
            System.err.println("Audit Logging Failed: " + e.getMessage());
        }
    }


}
