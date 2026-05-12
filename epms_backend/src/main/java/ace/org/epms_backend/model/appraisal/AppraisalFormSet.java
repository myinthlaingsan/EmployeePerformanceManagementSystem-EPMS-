package ace.org.epms_backend.model.appraisal;

import ace.org.epms_backend.model.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "appraisal_form_set")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
public class AppraisalFormSet extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cycle_id")
    private AppraisalCycle cycle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "self_assessment_form_id")
    private AppraisalForm selfAssessmentForm;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_evaluation_form_id")
    private AppraisalForm managerEvaluationForm;

    private Boolean isActive = true;
}
