import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useGetMeQuery } from "../../features/auth/authApi";

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
  const { isAuthenticated, hasAnyRole, user, hasPermission, accessToken} = useAuth();
  const location = useLocation();

  // Track if the profile fetch failed
  const { isError } = useGetMeQuery(undefined, {
    skip: !accessToken || !!user,
  });

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (accessToken && !user) {
    if (isError) {
      return <Navigate to="/login" replace />;
    }
    
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50/50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-sm font-medium text-gray-500 animate-pulse">Restoring Session...</p>
        </div>
      </div>
    );
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
