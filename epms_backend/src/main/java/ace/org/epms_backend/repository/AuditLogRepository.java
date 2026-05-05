package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByTableNameAndRecordId(String tableName, Long recordId);
    List<AuditLog> findByTableName(String tableName);
}
