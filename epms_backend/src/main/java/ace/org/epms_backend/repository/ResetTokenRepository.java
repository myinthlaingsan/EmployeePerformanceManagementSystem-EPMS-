package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.employee.ResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ResetTokenRepository extends JpaRepository<ResetToken,Long> {
    Optional<ResetToken> findByToken(String token);
}
