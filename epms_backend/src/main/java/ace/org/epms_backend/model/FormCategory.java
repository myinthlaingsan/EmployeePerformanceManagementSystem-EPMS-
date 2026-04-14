package ace.org.epms_backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "form_category")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FormCategory extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long categoryId;

    @ManyToOne
    @JoinColumn(name = "form_id")
    private AppraisalForm form;

    private String categoryName;

    private Boolean isActive = true;
}
