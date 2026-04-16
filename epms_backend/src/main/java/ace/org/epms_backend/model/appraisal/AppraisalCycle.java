package ace.org.epms_backend.model.appraisal;
import ace.org.epms_backend.enums.CycleStatus;
import ace.org.epms_backend.model.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;

@Entity
@Table(name = "appraisal_cycle")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
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
