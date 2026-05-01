package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.kpi.KpiLibrary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface KpiLibraryRepository extends JpaRepository<KpiLibrary, Long> {
    List<KpiLibrary> findByIsActiveTrue();
}
