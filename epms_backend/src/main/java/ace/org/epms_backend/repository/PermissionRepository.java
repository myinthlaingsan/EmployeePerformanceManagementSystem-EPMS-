package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.employee.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, Long> {
    boolean existsByPermissionName(String permissionName);
    Optional<Permission> findByPermissionName(String permissionName);
    // In PermissionRepository.java
    List<Permission> findAllByOrderByPermissionIdAsc();
}
