package ace.org.epms_backend.model.calibration;

import ace.org.epms_backend.model.BaseEntity;
import ace.org.epms_backend.model.feedback360.FeedbackSummary;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

@Entity
@Table(name = "calibration_session_summary",
        uniqueConstraints = @UniqueConstraint(columnNames = {"session_id", "summary_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
public class CalibrationSessionSummary extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private CalibrationSession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "summary_id", nullable = false)
    private FeedbackSummary summary;

    private BigDecimal scoreBeforeAdjustment;
    private BigDecimal scoreAfterAdjustment;
}
