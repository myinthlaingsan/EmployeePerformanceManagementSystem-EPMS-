package ace.org.epms_backend.model.appraisal;

import ace.org.epms_backend.enums.AppraisalStatus;
import ace.org.epms_backend.model.*;
import ace.org.epms_backend.model.employee.Employee;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

@Entity
@Table(name = "appraisal")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
public class Appraisal extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long appraisalId;

    @ManyToOne
    @JoinColumn(name = "employee_id")
    private Employee employee;

    @ManyToOne
    @JoinColumn(name = "manager_id")
    private Employee manager;

    @ManyToOne
    @JoinColumn(name = "cycle_id")
    private AppraisalCycle cycle;

    @ManyToOne
    @JoinColumn(name = "form_id")
    private AppraisalForm form;

    @ManyToOne
    @JoinColumn(name = "performance_category_id")
    private PerformanceCategory performanceCategory;

    @Enumerated(EnumType.STRING)
    private AppraisalStatus status;

    private BigDecimal formScore;

    private String performanceGrade;

    private Boolean employeeSigned;
    private Boolean managerSigned;

    private Boolean isActive = true;

    private Boolean isLocked;
}

