package ace.org.epms_backend.mapper;

import ace.org.epms_backend.dto.audit.AuditChangeDTO;
import ace.org.epms_backend.dto.audit.AuditLogDTO;
import ace.org.epms_backend.dto.audit.AuditLogDetailDTO;
import ace.org.epms_backend.dto.audit.FieldChangeDTO;
import ace.org.epms_backend.dto.employee.EmployeeResponse;
import ace.org.epms_backend.model.AuditLog;
import ace.org.epms_backend.model.employee.Employee;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class AuditLogMapper {

    public AuditLogDTO toDTO(AuditLog log) {
        return AuditLogDTO.builder()
                .auditId(log.getAuditId())
                .tableName(log.getTableName())
                .recordId(log.getRecordId())
                .action(log.getAction())
                .changedByName(resolveEmployeeName(log.getChangedBy()))
                .changedAt(log.getChangedAt())
                .ipAddress(log.getIpAddress())
                .status(log.getStatus())
                .build();
    }

    public AuditLogDetailDTO toDetailDTO(AuditLog log, Map<String, FieldChangeDTO> fieldChanges) {
        return AuditLogDetailDTO.builder()
                .auditId(log.getAuditId())
                .tableName(log.getTableName())
                .recordId(log.getRecordId())
                .action(log.getAction())
                .changedBy(toEmployeeResponse(log.getChangedBy()))
                .changedByName(resolveEmployeeName(log.getChangedBy()))
                .changedAt(log.getChangedAt())
                .ipAddress(log.getIpAddress())
                .userAgent(log.getUserAgent())
                .status(log.getStatus())
                .fieldChanges(fieldChanges)
                .build();
    }

    public AuditChangeDTO toChangeDTO(AuditLog log, int sequenceNumber, Map<String, FieldChangeDTO> changes) {
        return AuditChangeDTO.builder()
                .sequenceNumber(sequenceNumber)
                .auditId(log.getAuditId())
                .action(log.getAction())
                .changedAt(log.getChangedAt())
                .changedByName(resolveEmployeeName(log.getChangedBy()))
                .changes(changes)
                .build();
    }

    public String resolveEmployeeName(Employee employee) {
        if (employee == null) {
            return "SYSTEM";
        }
        return employee.getStaffName() != null ? employee.getStaffName() : "Employee #" + employee.getId();
    }

    private EmployeeResponse toEmployeeResponse(Employee employee) {
        if (employee == null) {
            return null;
        }
        return EmployeeResponse.builder()
                .id(employee.getId())
                .employeeCode(employee.getEmployeeCode())
                .staffName(employee.getStaffName())
                .email(employee.getEmail())
                .phoneNo(employee.getPhoneNo())
                .profileImage(employee.getProfileImage())
                .status(employee.getStatus())
                .isActive(employee.getIsActive())
                .build();
    }
}
