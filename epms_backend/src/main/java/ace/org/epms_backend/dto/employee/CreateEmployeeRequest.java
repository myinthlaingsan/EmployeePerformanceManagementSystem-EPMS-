package ace.org.epms_backend.dto.employee;

import ace.org.epms_backend.enums.Gender;
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
    private String staffName;
    private String otherName;
    private String email;
    private String phoneNo;

    private Integer stateCode;
    private String township;
    private String nrcType;
    private String number;

    private Gender gender;
    private LocalDate dateOfBirth;

    private Long positionId;
//    private Long levelId;

    private BigDecimal salary;
    private String currency;

    private Long roleId;
    private Long parentDepartmentId;   //Banking
    private Long currentDepartmentId;  // ERP or banking
    private Long directManagerId;
}
