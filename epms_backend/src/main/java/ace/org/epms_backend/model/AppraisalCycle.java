package ace.org.epms_backend.model;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "appraisal_cycle")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AppraisalCycle extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long cycleId;

    private String cycleName;

    private LocalDate startDate;
    private LocalDate endDate;

    private String evaluationPeriod;

    @Enumerated(EnumType.STRING)
    private CycleStatus status;

    private Boolean isActive = true;
}
