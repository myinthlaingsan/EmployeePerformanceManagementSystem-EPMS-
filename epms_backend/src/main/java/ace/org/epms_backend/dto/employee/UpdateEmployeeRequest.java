package ace.org.epms_backend.dto.employee;

import ace.org.epms_backend.enums.EmployeeStatus;
import ace.org.epms_backend.enums.Gender;
import ace.org.epms_backend.enums.MaritalStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class UpdateEmployeeRequest {

    @NotBlank(message = "staff name is required")
    private String staffName;

    private String otherName;

    // NRC
    private Integer stateCode;
    
    @NotBlank(message = "township is required")
    private String township;
    
    @NotBlank(message = "NRC type is required")
    private String nrcType;
    
    @NotBlank(message = "NRC number is required")
    private String number;

    @NotNull(message = "gender is required")
    private Gender gender;
    
    private String race;
    private String religion;

    @NotNull(message = "date of birth is required")
    private LocalDate dateOfBirth;
    
    private String birthPlace;

    private String contactAddress;
    private String permanentAddress;

    @NotBlank(message = "email is required")
    @Email(message = "invalid email format")
    private String email;

    @NotBlank(message = "phone number is required")
    private String phoneNo;

    private String profileImage;

    private MaritalStatus maritalStatus;
    private String spouseName;
    private String fatherName;

    @NotNull(message = "position is required")
    private Long positionId;

    @Positive(message = "salary must be positive")
    private BigDecimal salary;

    private String currency;

    private LocalDate dateOfAppointment;
    private LocalDate dateOfConfirmation;
    private LocalDate dateOfPromotion;

    private EmployeeStatus status;

    private Boolean isActive;

    //IMPORTANT (RBAC)
//    @NotEmpty(message = "at least one role must be assigned")
    private List<Long> roleIds;

    private Long directManagerId;
}
