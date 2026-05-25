package ace.org.epms_backend.service.feedback360;

import ace.org.epms_backend.model.UserPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class SecurityHelper {

    public Long currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return null;
        Object principal = auth.getPrincipal();
        if (principal instanceof UserPrincipal up) {
            return up.getEmployee().getId();
        }
        return null;
    }

    public boolean hasAnyRole(String... roles) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return false;
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(authority -> {
                    for (String role : roles) {
                        if (authority.equals("ROLE_" + role)) return true;
                    }
                    return false;
                });
    }
}
