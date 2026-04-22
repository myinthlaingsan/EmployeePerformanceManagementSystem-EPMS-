import { api } from "../../services/api";
import type { ApiResponse } from "../../services/ApiResponse";
import type { RoleRequest, RoleResponse, AssignRoleRequest } from "./orgTypes";
import type { EmployeeResponse } from "../employee/employeeTypes";

export const roleApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getRoles: builder.query<RoleResponse[], void>({
      query: () => "/org/roles",
      transformResponse: (res: ApiResponse<RoleResponse[]>) => res.data,
      providesTags: ["Role"],
    }),

    getRoleById: builder.query<RoleResponse, number>({
      query: (id) => `/org/roles/${id}`,
      transformResponse: (res: ApiResponse<RoleResponse>) => res.data,
      providesTags: (_result, _error, id) => [{ type: "Role", id }],
    }),

    createRole: builder.mutation<RoleResponse, RoleRequest>({
      query: (body) => ({
        url: "/org/roles",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Role"],
    }),

    updateRole: builder.mutation<RoleResponse, { id: number; body: RoleRequest }>({
      query: ({ id, body }) => ({
        url: `/org/roles/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Role", id }, "Role"],
    }),

    deleteRole: builder.mutation<void, number>({
      query: (id) => ({
        url: `/org/roles/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Role"],
    }),

    // Employee Role Assignments (from EmployeeRoleController)
    assignRoleToEmployee: builder.mutation<
      void,
      { employeeId: number; body: AssignRoleRequest }
    >({
      query: ({ employeeId, body }) => ({
        url: `/employees/${employeeId}/roles`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Employee"], // Invalidates employee to refresh their roles
    }),

    getRolesByEmployeeId: builder.query<RoleResponse[], number>({
      query: (employeeId) => `/employees/${employeeId}/roles`,
      transformResponse: (res: ApiResponse<RoleResponse[]>) => res.data,
    }),

    removeRoleFromEmployee: builder.mutation<
      void,
      { employeeId: number; roleId: number }
    >({
      query: ({ employeeId, roleId }) => ({
        url: `/employees/${employeeId}/roles/${roleId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Employee"],
    }),

    getEmployeesByRoleId: builder.query<EmployeeResponse[], number>({
      query: (roleId) => `/roles/${roleId}/employees`,
      transformResponse: (res: ApiResponse<EmployeeResponse[]>) => res.data,
    }),
  }),
});

export const {
  useGetRolesQuery,
  useGetRoleByIdQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useAssignRoleToEmployeeMutation,
  useGetRolesByEmployeeIdQuery,
  useRemoveRoleFromEmployeeMutation,
  useGetEmployeesByRoleIdQuery,
} = roleApi;
