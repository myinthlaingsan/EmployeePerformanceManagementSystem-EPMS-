package ace.org.epms_backend.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ForgotPasswordEvent {
    private Long employeeId;
    private String token;
}
