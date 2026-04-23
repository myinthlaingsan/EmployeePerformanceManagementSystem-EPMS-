package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.auth.BlacklistedToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BlacklistedTokenRepository extends JpaRepository<BlacklistedToken, String> {
}
