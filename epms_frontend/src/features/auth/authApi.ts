import { api } from "../../services/api";
import type { ApiResponse } from "../../services/ApiResponse";
import type { AuthRequest, AuthResponse, RefreshTokenRequest } from "./authTypes";
import type { EmployeeResponse } from "../employee/employeeTypes";

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, AuthRequest>({
      query: (data) => ({
        url: "/auth/login",
        method: "POST",
        body: data,
      }),
      transformResponse: (res: ApiResponse<AuthResponse>) => res.data,
    }),
    refreshToken: builder.mutation<AuthResponse, RefreshTokenRequest>({
      query: (data) => ({
        url: "/auth/refresh-token",
        method: "POST",
        body: data,
      }),
      transformResponse: (res: ApiResponse<AuthResponse>) => res.data,
    }),
    getMe: builder.query<EmployeeResponse, void>({
      query: () => "/auth/me",
      transformResponse: (res: ApiResponse<EmployeeResponse>) => res.data,
      providesTags: ["Profile"],
    }),
    unlockEmployee: builder.mutation<void, number>({
      query: (employeeId) => ({
        url: `/auth/unlock/${employeeId}`,
        method: "PUT",
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRefreshTokenMutation,
  useGetMeQuery,
  useUnlockEmployeeMutation,
} = authApi;
