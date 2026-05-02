package ace.org.epms_backend.dto.employee;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SetPasswordRequest {
    @NotBlank(message = "password required")
    @Size(min = 6, message = "password must be at least 6 characters")
    private String password;
}
