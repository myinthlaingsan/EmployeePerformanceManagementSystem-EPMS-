package ace.org.epms_backend.model.employee;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "role_level_permission")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RoleLevelPermission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "role_id")
    private Role role;

    @ManyToOne
    @JoinColumn(name = "level_id")
    private JobLevel level;

    @ManyToOne
    @JoinColumn(name = "permission_id")
    private Permission permission;
}