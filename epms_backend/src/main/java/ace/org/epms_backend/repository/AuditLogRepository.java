package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.AuditLog;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.enums.AuditAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long>, JpaSpecificationExecutor<AuditLog> {
    List<AuditLog> findByTableNameAndRecordId(String tableName, Long recordId);
    List<AuditLog> findByTableName(String tableName);

    List<AuditLog> findTop10ByTableNameOrderByChangedAtDesc(String tableName);

    long countByTableNameAndChangedAtAfter(String tableName, Instant timestamp);

    List<AuditLog> findByTableNameAndRecordIdOrderByChangedAtDesc(String tableName, Long recordId);

    List<AuditLog> findByChangedByAndChangedAtBetween(Employee changedBy, Instant start, Instant end);

    List<AuditLog> findByTableNameAndActionAndChangedAtBetween(String tableName, AuditAction action, Instant start, Instant end);

    List<AuditLog> findByChangedAtBetween(Instant start, Instant end);
}
