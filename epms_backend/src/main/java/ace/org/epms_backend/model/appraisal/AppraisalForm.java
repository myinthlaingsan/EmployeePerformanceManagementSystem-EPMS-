package ace.org.epms_backend.model.appraisal;

import ace.org.epms_backend.enums.FeedbackRelationship;
import ace.org.epms_backend.enums.FormType;
import ace.org.epms_backend.model.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "appraisal_form")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
public class AppraisalForm extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long formId;

    private String formName;

    @Enumerated(EnumType.STRING)
    private FormType formType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cycle_id")
    private AppraisalCycle cycle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "form_set_id")
    private AppraisalFormSet formSet;

    private Long createdBy;

    // Nullable; when set, this form is the designated 360° form for that relationship type
    @Enumerated(EnumType.STRING)
    @Column(name = "target_relationship")
    private FeedbackRelationship targetRelationship;
}

