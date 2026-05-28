package ace.org.epms_backend.specification;

import ace.org.epms_backend.dto.audit.AuditFilterCriteria;
import ace.org.epms_backend.enums.AuditStatus;
import ace.org.epms_backend.model.AuditLog;
import ace.org.epms_backend.model.employee.Employee;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

public class AuditLogSpecification {

    private AuditLogSpecification() {
    }

    public static Specification<AuditLog> byCriteria(AuditFilterCriteria criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (criteria.getTableName() != null && !criteria.getTableName().isBlank()) {
                predicates.add(cb.equal(root.get("tableName"), criteria.getTableName()));
            }
            if (criteria.getRecordId() != null) {
                predicates.add(cb.equal(root.get("recordId"), criteria.getRecordId()));
            }
            if (criteria.getChangedByUserId() != null) {
                Join<AuditLog, Employee> employeeJoin = root.join("changedBy", JoinType.LEFT);
                predicates.add(cb.equal(employeeJoin.get("id"), criteria.getChangedByUserId()));
            }
            if (criteria.getAction() != null) {
                predicates.add(cb.equal(root.get("action"), criteria.getAction()));
            }
            if (criteria.getStatus() != null) {
                if (criteria.getStatus() == AuditStatus.FAILURE || criteria.getStatus() == AuditStatus.FAILED) {
                    predicates.add(root.get("status").in(AuditStatus.FAILURE, AuditStatus.FAILED));
                } else {
                    predicates.add(cb.equal(root.get("status"), criteria.getStatus()));
                }
            }
            if (criteria.getDateRange() != null
                    && criteria.getDateRange().getStartDate() != null
                    && criteria.getDateRange().getEndDate() != null) {
                Instant startInstant = criteria.getDateRange().getStartDate()
                        .atStartOfDay(ZoneId.systemDefault())
                        .toInstant();
                Instant endInstant = criteria.getDateRange().getEndDate()
                        .atTime(23, 59, 59)
                        .atZone(ZoneId.systemDefault())
                        .toInstant();
                predicates.add(cb.between(root.get("changedAt"), startInstant, endInstant));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
