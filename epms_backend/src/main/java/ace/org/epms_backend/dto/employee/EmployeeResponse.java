package ace.org.epms_backend.dto.employee;

import ace.org.epms_backend.enums.EmployeeStatus;
import ace.org.epms_backend.enums.Gender;
import ace.org.epms_backend.enums.MaritalStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeResponse {
    private Long id;
    private String employeeCode;
    private String staffName;
    private String otherName;
    private String email;
    private String phoneNo;
    private String profileImage;

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

    private MaritalStatus maritalStatus;
    private String spouseName;
    private String fatherName;

    private String positionName;
    private Long positionId;
    private String levelName;
    private Integer levelRank;

    private String currentDepartmentName;
    private Long currentDepartmentId;
    private String parentDepartmentName;
    private Long parentDepartmentId;

    private BigDecimal salary;
    private String currency;

    private LocalDate dateOfAppointment;
    private LocalDate dateOfConfirmation;
    private LocalDate dateOfPromotion;

    private EmployeeStatus status;
    private Boolean isActive;

    private Long directManagerId;
    private String directManagerName;
    private List<String> roles;
    private List<String> permissions;
}
