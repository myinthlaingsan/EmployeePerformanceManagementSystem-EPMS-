import { api } from "../../services/api";
import type { TeamRequest, TeamResponse, TeamAssignmentRequest, TeamMemberResponse } from "./orgTypes";

export const teamApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getTeams: builder.query<TeamResponse[], void>({
      query: () => "/teams",
      providesTags: ["Teams"],
    }),
    createTeam: builder.mutation<number, TeamRequest>({
      query: (body) => ({
        url: "/teams",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Teams"],
    }),
    assignEmployee: builder.mutation<void, TeamAssignmentRequest>({
      query: (body) => ({
        url: "/teams/assign",
        method: "POST",
        body,
      }),
      invalidatesTags: ["TeamMembers"],
    }),
    getTeamMembers: builder.query<TeamMemberResponse[], number>({
      query: (teamId) => `/teams/${teamId}/members`,
      providesTags: ["TeamMembers"],
    }),
    getEmployeeTeams: builder.query<TeamResponse[], number>({
      query: (employeeId) => `/teams/employee/${employeeId}`,
      providesTags: ["EmployeeTeams"],
    }),
  }),
});

export const {
  useGetTeamsQuery,
  useCreateTeamMutation,
  useAssignEmployeeMutation,
  useGetTeamMembersQuery,
  useGetEmployeeTeamsQuery,
} = teamApi;
