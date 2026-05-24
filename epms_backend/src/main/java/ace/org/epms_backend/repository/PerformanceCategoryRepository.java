package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.PerformanceCategory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PerformanceCategoryRepository extends JpaRepository<PerformanceCategory, Long> {
}
