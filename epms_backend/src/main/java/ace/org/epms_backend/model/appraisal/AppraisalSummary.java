package ace.org.epms_backend.model.appraisal;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

@Entity
@Table(name = "appraisal_summary")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class AppraisalSummary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long employeeId;

    @ManyToOne
    @JoinColumn(name = "cycle_id")
    private AppraisalCycle cycle;

    private BigDecimal totalScore; // across all forms

    private String finalGrade;
}
