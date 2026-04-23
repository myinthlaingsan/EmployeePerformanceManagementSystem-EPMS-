import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

interface ProtectedRouteProps {
  allowedRoles?: string[];
  minLevel?: number;
  maxLevel?: number;
  requiredPermissions?: string[];
}

const ProtectedRoute = ({
  allowedRoles,
  minLevel,
  maxLevel,
  requiredPermissions,
}: ProtectedRouteProps) => {
  const { isAuthenticated, hasAnyRole, user, hasPermission } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check
  if (allowedRoles && !hasAnyRole(allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Level check (ABAC)
  if (user) {
    if (minLevel && user.levelRank > minLevel) {
      return <Navigate to="/unauthorized" replace />;
    }

    if (maxLevel && user.levelRank < maxLevel) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Permission check (ABAC)
  if (
    requiredPermissions &&
    !requiredPermissions.every((p) => hasPermission(p))
  ) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
