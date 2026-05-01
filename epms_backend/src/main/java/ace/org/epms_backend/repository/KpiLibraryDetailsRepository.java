package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.kpi.KpiLibraryDetails;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface KpiLibraryDetailsRepository extends JpaRepository<KpiLibraryDetails, Long> {
}
