package ace.org.epms_backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "appraisal_form")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AppraisalForm extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long formId;

    private String formName;

    private Long createdBy;
}
