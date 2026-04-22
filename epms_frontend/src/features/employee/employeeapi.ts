import {api} from "../../services/api"
import type { ApiResponse } from "../../services/ApiResponse";
import type {
  EmployeeResponse,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
  SetPasswordRequest,
} from "./employeeTypes";

// Extend base API
export const employeeApi = api.injectEndpoints({
  endpoints: (builder) => ({

    getEmployees: builder.query<EmployeeResponse[], void>({
      query: () => "/emp",
      transformResponse: (response: ApiResponse<EmployeeResponse[]>) =>
        response.data,
      providesTags: ["Employee"],
    }),

    getEmployeeById: builder.query<EmployeeResponse, number>({
      query: (id) => `/emp/${id}`,
      transformResponse: (response: ApiResponse<EmployeeResponse>) =>
        response.data,
      providesTags: (_result, _error, id) => [{ type: "Employee", id }],
    }),

    createEmployee: builder.mutation<
      EmployeeResponse,
      CreateEmployeeRequest
    >({
      query: (body) => ({
        url: "/emp",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<EmployeeResponse>) =>
        response.data,
      invalidatesTags: ["Employee"],
    }),


    updateEmployee: builder.mutation<
      EmployeeResponse,
      { id: number; body: UpdateEmployeeRequest }
    >({
      query: ({ id, body }) => ({
        url: `/emp/${id}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: ApiResponse<EmployeeResponse>) =>
        response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Employee", id },
        "Employee",
      ],
    }),

    deleteEmployee: builder.mutation<void, number>({
      query: (id) => ({
        url: `/emp/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Employee"],
    }),


    activateEmployee: builder.mutation<void, number>({
      query: (id) => ({
        url: `/emp/${id}/activate`,
        method: "PATCH",
      }),
      invalidatesTags: ["Employee"],
    }),

    deactivateEmployee: builder.mutation<void, number>({
      query: (id) => ({
        url: `/emp/${id}/deactivate`,
        method: "PATCH",
      }),
      invalidatesTags: ["Employee"],
    }),

    getCurrentUser: builder.query<EmployeeResponse, void>({
      query: () => "/auth/me",
      transformResponse: (response: ApiResponse<EmployeeResponse>) =>
        response.data,
      providesTags: ["Profile"],
    }),


    updateProfile: builder.mutation<
      EmployeeResponse,
      { id: number; body: UpdateProfileRequest }
    >({
      query: ({ id, body }) => ({
        url: `/emp/${id}/profile`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: ApiResponse<EmployeeResponse>) =>
        response.data,
      invalidatesTags: ["Profile"],
    }),

    changePassword: builder.mutation<
      void,
      { id: number; body: ChangePasswordRequest }
    >({
      query: ({ id, body }) => ({
        url: `/emp/${id}/change-password`,
        method: "POST",
        body,
      }),
    }),

    setPassword: builder.mutation<
      void,
      { token: string; body: SetPasswordRequest }
    >({
      query: ({ token, body }) => ({
        url: `/emp/set-password?token=${token}`,
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useGetEmployeesQuery,
  useGetEmployeeByIdQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
  useActivateEmployeeMutation,
  useDeactivateEmployeeMutation,
  useGetCurrentUserQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useSetPasswordMutation,
} = employeeApi;