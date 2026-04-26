package ace.org.epms_backend.dto.employee;

import ace.org.epms_backend.enums.EmployeeStatus;
import ace.org.epms_backend.enums.Gender;
import ace.org.epms_backend.enums.MaritalStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class UpdateEmployeeRequest {

    @NotBlank
    private String staffName;

    private String otherName;

    // NRC
    private Integer stateCode;
    private String township;
    private String nrcType;
    private String number;

    private Gender gender;
    private String race;
    private String religion;

    private LocalDate dateOfBirth;
    private String birthPlace;

    private String contactAddress;
    private String permanentAddress;

    @Email
    private String email;

    private String phoneNo;

    private MaritalStatus maritalStatus;
    private String spouseName;
    private String fatherName;

    @NotNull
    private Long positionId;

    @Positive
    private BigDecimal salary;

    private String currency;

    private LocalDate dateOfAppointment;
    private LocalDate dateOfConfirmation;
    private LocalDate dateOfPromotion;

    private EmployeeStatus status;

    private Boolean isActive;

    //IMPORTANT (RBAC)
    private List<Long> roleIds;
}
