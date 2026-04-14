package ace.org.epms_backend.model;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "pip_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PipRecord extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long pipId;

    @ManyToOne
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne
    @JoinColumn(name = "manager_id", nullable = false)
    private Employee manager;

    @ManyToOne
    @JoinColumn(name = "appraisal_id")
    private Appraisal appraisal;

    private LocalDate startDate;
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    private PipStatus status;

    @Enumerated(EnumType.STRING)
    private PipOutcome finalOutcome;

    @Column(columnDefinition = "TEXT")
    private String overallComment;

    private Boolean isActive = true;

    private Long createdBy;
}