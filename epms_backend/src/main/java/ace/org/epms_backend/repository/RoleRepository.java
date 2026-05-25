package ace.org.epms_backend.repository;

import ace.org.epms_backend.enums.RoleType;
import ace.org.epms_backend.model.employee.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByRoleName(RoleType roleName);
    List<Role> findAllByOrderByRoleIdAsc();
    boolean existsByRoleName(RoleType roleName);
}
