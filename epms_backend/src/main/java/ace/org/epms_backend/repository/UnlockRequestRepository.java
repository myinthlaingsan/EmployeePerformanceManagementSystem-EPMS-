package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.appraisal.UnlockRequest;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UnlockRequestRepository extends JpaRepository<UnlockRequest, Long> {
}
