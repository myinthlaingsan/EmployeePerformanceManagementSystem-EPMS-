package ace.org.epms_backend.dto.employee;

import ace.org.epms_backend.enums.Gender;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateEmployeeRequest {
    @NotBlank(message = "staff name is required")
    private String staffName;

    private String otherName;

    @NotBlank(message = "email is required")
    @Email(message = "invalid email format")
    private String email;

    @NotBlank(message = "phone number is required")
    private String phoneNo;

    private String profileImage;

    private Integer stateCode;

    @NotBlank(message = "township is required")
    private String township;

    @NotBlank(message = "NRC type is required")
    private String nrcType;

    @NotBlank(message = "NRC number is required")
    private String number;

    @NotNull(message = "gender is required")
    private Gender gender;

    @NotNull(message = "date of birth is required")
    private LocalDate dateOfBirth;

    @NotNull(message = "position is required")
    private Long positionId;

    @Positive(message = "salary must be positive")
    private BigDecimal salary;

    private String currency;

    @NotNull(message = "role is required")
    private Long roleId;

    private Long parentDepartmentId; // Banking
    @NotNull(message = "current department is required")
    private Long currentDepartmentId;

    private Long directManagerId;
}
