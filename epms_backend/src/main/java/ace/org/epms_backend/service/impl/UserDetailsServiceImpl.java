package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.model.UserPrincipal;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.employee.Permission;
import ace.org.epms_backend.model.employee.Role;
import ace.org.epms_backend.repository.EmployeeRepository;
import ace.org.epms_backend.repository.EmployeeRoleRepository;
import ace.org.epms_backend.repository.RoleLevelPermissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {
    private final EmployeeRepository employeeRepo;
    private final EmployeeRoleRepository employeeRoleRepo;
    private final RoleLevelPermissionRepository rlpRepo;
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Employee emp = employeeRepo.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        List<Role> roles = employeeRoleRepo.findRolesByEmployeeId(emp.getId());

        List<Permission> permissions = rlpRepo
                .findPermissionsByRolesAndLevel(roles, emp.getLevel());
        // 3. Convert to authorities
        List<GrantedAuthority> authorities = new ArrayList<>();
        roles.forEach(role ->
                authorities.add(new SimpleGrantedAuthority("ROLE_" + role.getRoleName()))
        );
        permissions.forEach(permission ->
                authorities.add(new SimpleGrantedAuthority(permission.getPermissionName()))
        );

        return new UserPrincipal(emp, authorities);
    }
}
