package ace.org.epms_backend.model.employee;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "employee_role")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeRole {

    @Id
    @ManyToOne
    @JoinColumn(name = "employee_id")
    private Employee employee;

    @Id
    @ManyToOne
    @JoinColumn(name = "role_id")
    private Role role;
}