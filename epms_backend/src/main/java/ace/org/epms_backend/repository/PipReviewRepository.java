package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.pip.PipReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PipReviewRepository extends JpaRepository<PipReview, Long> {

    List<PipReview> findByPip_PipId(Long pipId);
}