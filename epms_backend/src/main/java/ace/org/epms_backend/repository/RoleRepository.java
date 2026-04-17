package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.employee.Role;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<Role, Long> {
}
