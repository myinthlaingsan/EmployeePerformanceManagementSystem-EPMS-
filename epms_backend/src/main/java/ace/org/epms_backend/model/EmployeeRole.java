package ace.org.epms_backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;

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