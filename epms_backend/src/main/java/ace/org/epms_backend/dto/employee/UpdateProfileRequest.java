package ace.org.epms_backend.dto.employee;

import ace.org.epms_backend.enums.MaritalStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {
    @NotBlank
    private String staffName;

    private String otherName;

    private String contactAddress;
    private String permanentAddress;

    @Email
    private String email;

    private String phoneNo;

    private MaritalStatus maritalStatus;
    private String spouseName;
    private String fatherName;
}
