import type { RootState } from "../app/store";
import { logout } from "../features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "./reduxHooks";
import { useLogoutUserApiMutation, useGetMeQuery } from "../features/auth/authApi";
import { useGetActiveCycleQuery } from "../services/kpiApi";

const normalizeRole = (role: string) => role.replace("ROLE_", "");

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const [logoutApi] = useLogoutUserApiMutation();

  const { user, isAuthenticated, accessToken, refreshToken } = useAppSelector(
    (state: RootState) => state.auth,
  );

  const { isLoading: isLoadingUser } = useGetMeQuery(undefined, {
    skip: !accessToken || !!user,
  });

  const { data: cycleResponse, isLoading: isLoadingCycle, error: cycleError } = useGetActiveCycleQuery(undefined, {
    skip: !isAuthenticated,
  });

  const logoutUser = async () => {
    try {
      await logoutApi().unwrap();
    } catch (err) {
      console.error("Logout API failed:", err);
    } finally {
      dispatch(logout());
      // Optional: Redirect or reload to ensure clean state
      window.location.href = "/login";
    }
  };

  const hasRole = (role: string) => {
    if (!user || !user.roles) return false;
    return user.roles.map(normalizeRole).includes(normalizeRole(role));
  };

  const hasAnyRole = (roles: string[]) => {
    if (!user || !user.roles) return false;
    return roles.some(role => hasRole(role));
  };

  const hasPermission = (permission: string) => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission);
  };

  return {
    user,
    isAuthenticated,
    accessToken,
    refreshToken,
    logout: logoutUser,
    hasRole,
    hasAnyRole,
    hasPermission,
    isAdmin: hasRole("ADMIN"),
    isManager: hasRole("MANAGER"),
    isHR: hasRole("HR"),
    isEmployee: hasRole("EMPLOYEE"),
    // ABAC Helpers
    isSenior: user ? user.levelRank <= 4 : false,
    isJunior: user ? user.levelRank >= 7 : false,
    // Cycle Info
    activeCycleId: cycleResponse?.data?.cycleId,
    activeCycleName: cycleResponse?.data?.cycleName || 'No Active Cycle',
    isLoading: isLoadingUser || isLoadingCycle,
    isLoadingCycle,
    cycleError,
  };
};
