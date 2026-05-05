package ace.org.epms_backend.model.appraisal;

import ace.org.epms_backend.enums.CycleStatus;
import ace.org.epms_backend.model.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "appraisal_cycles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class AppraisalCycle extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long cycleId;

    private String cycleName;

    private LocalDate startDate;

    private LocalDate endDate;

    private LocalDate selfAssessmentDeadline;

    private LocalDate managerEvaluationDeadline;

    private LocalDate finalizationDeadline;

    private String evaluationPeriod;

    @Enumerated(EnumType.STRING)
    private CycleStatus status;

    @OneToMany(mappedBy = "cycle", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<AppraisalForm> forms = new ArrayList<>();

    private Boolean isActive = true;
}
