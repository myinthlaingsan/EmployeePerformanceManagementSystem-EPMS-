package ace.org.epms_backend.model.auth;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "blacklisted_tokens")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BlacklistedToken {
    @Id
    private String token;
    private LocalDateTime expiryDate;
}
