package ace.org.epms_backend.service;

import ace.org.epms_backend.model.auth.BlacklistedToken;
import ace.org.epms_backend.repository.BlacklistedTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;

@Service
@RequiredArgsConstructor
public class TokenBlacklistService {

    private final BlacklistedTokenRepository repository;
    private final JwtService jwtService;

    public void blacklistToken(String token) {
        Date expiryDate = jwtService.extractExpiration(token);
        LocalDateTime expiry = expiryDate.toInstant()
                .atZone(ZoneId.systemDefault())
                .toLocalDateTime();

        BlacklistedToken blacklisted = new BlacklistedToken(token, expiry);
        repository.save(blacklisted);
    }

    public boolean isBlacklisted(String token) {
        return repository.existsById(token);
    }
}
