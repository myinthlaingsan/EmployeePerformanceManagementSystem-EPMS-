package ace.org.epms_backend.model.calibration;

import ace.org.epms_backend.enums.CalibrationSessionStatus;
import ace.org.epms_backend.model.BaseEntity;
import ace.org.epms_backend.model.appraisal.AppraisalCycle;
import ace.org.epms_backend.model.employee.Department;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.Instant;

@Entity
@Table(name = "calibration_session")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
public class CalibrationSession extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cycle_id", nullable = false)
    private AppraisalCycle cycle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    private String name;
    private String facilitator;
    private Instant scheduledAt;
    private Instant completedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CalibrationSessionStatus status;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
