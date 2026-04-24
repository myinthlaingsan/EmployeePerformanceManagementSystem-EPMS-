import { api } from "../../services/api";
import type { ApiResponse } from "../../services/ApiResponse";
import type { DepartmentRequest, DepartmentResponse } from "./orgTypes";

export const departmentApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDepartments: builder.query<DepartmentResponse[], void>({
      query: () => "/org/departments",
      transformResponse: (res: ApiResponse<DepartmentResponse[]>) => res.data,
      providesTags: ["Department"],
    }),

    getDepartmentById: builder.query<DepartmentResponse, number>({
      query: (id) => `/org/departments/${id}`,
      transformResponse: (res: ApiResponse<DepartmentResponse>) => res.data,
      providesTags: (_result, _error, id) => [{ type: "Department", id }],
    }),

    createDepartment: builder.mutation<DepartmentResponse, DepartmentRequest>({
      query: (body) => ({
        url: "/org/departments",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Department"],
    }),

    updateDepartment: builder.mutation<
      DepartmentResponse,
      { id: number; body: DepartmentRequest }
    >({
      query: ({ id, body }) => ({
        url: `/org/departments/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Department", id },
        "Department",
      ],
    }),

    deleteDepartment: builder.mutation<void, number>({
      query: (id) => ({
        url: `/org/departments/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Department"],
    }),
  }),
});

export const {
  useGetDepartmentsQuery,
  useGetDepartmentByIdQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
} = departmentApi;
