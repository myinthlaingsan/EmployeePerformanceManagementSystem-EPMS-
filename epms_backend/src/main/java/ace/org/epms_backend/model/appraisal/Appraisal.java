package ace.org.epms_backend.model.appraisal;

import ace.org.epms_backend.enums.AppraisalStatus;
import ace.org.epms_backend.model.BaseEntity;
import ace.org.epms_backend.model.PerformanceCategory;
import ace.org.epms_backend.model.employee.Employee;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "appraisals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Appraisal extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long appraisalId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id", nullable = false)
    private Employee manager;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cycle_id", nullable = false)
    private AppraisalCycle cycle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performance_category_id")
    private PerformanceCategory performanceCategory;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "form_set_id")
    private AppraisalFormSet formSet;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AppraisalStatus status;

    private Instant assignedAt;

    private Instant selfSubmittedAt;

    private Instant managerSubmittedAt;

    private Instant hrApprovedAt;

    private Instant finalizedAt;

    private Instant employeeSignedAt;

    private Instant managerSignedAt;

    private Instant lockedAt;

    @Column(name = "employee_sign_comment")
    private String employeeSignComment;

    @Column(name = "manager_sign_comment")
    private String managerSignComment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private Employee approvedBy;

    @Column(columnDefinition = "TEXT")
    private String approvalComment;

    private Boolean isLocked = false;

    private Boolean isActive = true;
}




