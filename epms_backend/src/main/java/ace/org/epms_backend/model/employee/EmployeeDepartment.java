package ace.org.epms_backend.model.employee;
import ace.org.epms_backend.model.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "employee_department")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
public class EmployeeDepartment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "employee_id")
    private Employee employee;

    @ManyToOne
    @JoinColumn(name = "current_department_id")
    private Department currentDepartment;

    @ManyToOne
    @JoinColumn(name = "parent_department_id")
    private Department parentDepartment;

    private Boolean isCurrent = true;

    private Long createdBy;
}