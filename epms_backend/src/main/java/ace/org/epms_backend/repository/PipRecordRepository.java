package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.pip.PipRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PipRecordRepository extends JpaRepository<PipRecord, Long> {

    List<PipRecord> findByEmployeeId(Long employeeId);

    List<PipRecord> findByManagerId(Long managerId);
}