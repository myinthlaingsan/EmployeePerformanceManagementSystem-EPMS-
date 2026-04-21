import { logout, setTokens} from "../features/auth/authSlice";
// import type { AuthResponse } from "../features/auth/authTypes";
import { baseQuery } from "./baseQuery";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { AuthResponse } from "../features/auth/authTypes"
import type { ApiResponse } from "../services/ApiResponse";
export const baseQueryWithReauth = async(args: any, api: any, extraOptions: any) => {
    let result = await baseQuery(args, api, extraOptions);
    // If 401 → try refresh
    if (args.url === "/auth/refresh-token") return result;

  if (result.error && result.error.status === 401) {
    const refreshToken = (api.getState() as any).auth.refreshToken;
    if (!refreshToken) {
      api.dispatch(logout());
      return result;
    }
    // Try refresh token
    const refreshResult = await baseQuery(
      {
        url: "/auth/refresh-token",
        method: "POST",
        body: { refreshToken },
        headers: {
      Authorization: "", 
    },
      },
      api,
      extraOptions
    );

    if (refreshResult.data) {
      const data = (refreshResult.data as ApiResponse<AuthResponse>).data;
      // Save new tokens
      api.dispatch(setTokens(data));

      result = await baseQuery(
        {
          ...args,
          headers: {
            ...args.headers,
            Authorization: `Bearer ${data.accessToken}`,
          },
        },
        api,
        extraOptions
      );
    } else {
      const err = refreshResult.error as FetchBaseQueryError;

      if (err.status === 401 || err.status === 403) {
        api.dispatch(logout());
      }
    }
  }
  return result;
}