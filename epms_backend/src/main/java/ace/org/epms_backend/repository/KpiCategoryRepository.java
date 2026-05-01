package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.kpi.KpiCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface KpiCategoryRepository extends JpaRepository<KpiCategory, Long> {
    Optional<KpiCategory> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);
}
