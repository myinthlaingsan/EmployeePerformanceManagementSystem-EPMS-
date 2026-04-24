package ace.org.epms_backend.model.employee;


import ace.org.epms_backend.model.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import ace.org.epms_backend.enums.Gender;
import ace.org.epms_backend.enums.MaritalStatus;
import ace.org.epms_backend.enums.EmployeeStatus;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "employee")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
public class Employee extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true)
    private String employeeCode;

    private String staffName;
    private String otherName;
//    private String nrcNo;
    private Integer stateCode;
    private String township;
    private String nrcType;
    private String number;

    @Enumerated(EnumType.STRING)
    private Gender gender;

    private String race;
    private String religion;

    private LocalDate dateOfBirth;
    private String birthPlace;

    @Column(columnDefinition = "TEXT")
    private String contactAddress;

    @Column(columnDefinition = "TEXT")
    private String permanentAddress;

    private String phoneNo;
    private String email;
    private String password;
    @Enumerated(EnumType.STRING)
    private MaritalStatus maritalStatus;

    private String spouseName;
    private String fatherName;

    private String department;
//    @ManyToOne
//    @JoinColumn(name = "department_id")
//    private Department department;
    @ManyToOne
    @JoinColumn(name = "position_id")
    private Position position;

    @ManyToOne
    @JoinColumn(name = "level_id")
    private JobLevel level;

    private BigDecimal salary;
    private String currency;

    private LocalDate dateOfAppointment;
    private LocalDate dateOfConfirmation;
    private LocalDate dateOfPromotion;

    @Enumerated(EnumType.STRING)
    private EmployeeStatus status;

    private Boolean isActive = true;

    @Column(name = "failed_attempts", columnDefinition = "INT DEFAULT 0")
    private int failedLoginAttempts = 0;
    @Column(name = "account_locked", columnDefinition = "BOOLEAN DEFAULT false")
    private boolean accountLocked = false;
    private LocalDateTime lockTime;
}