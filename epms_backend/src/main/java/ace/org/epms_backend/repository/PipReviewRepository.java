package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.pip.PipReview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PipReviewRepository extends JpaRepository<PipReview, Long> {

    List<PipReview> findByPip_PipId(Long pipId);
}