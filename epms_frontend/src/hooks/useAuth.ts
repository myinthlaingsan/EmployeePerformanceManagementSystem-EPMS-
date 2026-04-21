import type { RootState } from "../app/store";
import { logout } from "../features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "./reduxHooks";

export const useAuth = () => {
  const dispatch = useAppDispatch();

  const { user, isAuthenticated, accessToken, refreshToken } = useAppSelector(
    (state: RootState) => state.auth,
  );
  
  const logoutUser = () => {
    dispatch(logout());
  };

  const hasRole = (role: string) => {
    if (!user) return false;

    const userRole = user.role?.role;

    return userRole === role || `ROLE_${userRole}` === role;
  };

  const hasAnyRole = (roles: string[]) => {
    // return roles.some((role) => hasRole(role));
    return roles.includes(user?.role?.role || "");
  };

  return {
    user,
    isAuthenticated,
    accessToken,
    refreshToken,
    logout: logoutUser,
    hasRole,
    hasAnyRole,
    isAdmin: hasRole("ADMIN"),
    isManager: hasRole("MANAGER"),
    isHR: hasRole("HR"),
    isEmployee: hasRole("EMPLOYEE"),
  };
};
