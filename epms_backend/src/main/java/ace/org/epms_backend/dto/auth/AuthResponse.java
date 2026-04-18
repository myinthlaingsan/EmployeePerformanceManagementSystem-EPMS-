package ace.org.epms_backend.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {
    private String access_token;
    private String refresh_token;
    private String message;
}
