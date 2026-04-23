package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.employee.JobLevel;
import ace.org.epms_backend.model.employee.Permission;
import ace.org.epms_backend.model.employee.Role;
import ace.org.epms_backend.model.employee.RoleLevelPermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoleLevelPermissionRepository extends JpaRepository<RoleLevelPermission, Long> {
    @Query("""
                SELECT rlp.permission FROM RoleLevelPermission rlp
                WHERE rlp.role IN :roles AND rlp.level = :level
            """)
    List<Permission> findPermissionsByRolesAndLevel(List<Role> roles, JobLevel level);
}
