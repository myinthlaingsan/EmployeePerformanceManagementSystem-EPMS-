package ace.org.epms_backend.repository.feedback360;

import ace.org.epms_backend.enums.NominationStatus;
import ace.org.epms_backend.model.feedback360.FeedbackNomination;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeedbackNominationRepository extends JpaRepository<FeedbackNomination, Long> {
    List<FeedbackNomination> findByNominatedById(Long nominatedById);
    List<FeedbackNomination> findByStatus(NominationStatus status);
    List<FeedbackNomination> findByTargetUserId(Long targetUserId);
}
