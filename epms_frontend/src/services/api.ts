// services/api.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQueryWithReauth";

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Employee", "Profile", "Department", "Role", "JobLevel", "Position", 
    "EmployeeDepartment", "Permission", "RoleLevelPermission", "PIP", 
    "PipObjective", "PipProgress", "PipReview", "Form", "Cycle", 
    "Appraisal", "Teams", "TeamMembers", "EmployeeTeams",
    "Library", "GoalSet", "Progress", "Score", "Category"
  ],
  endpoints: () => ({}),
  // This adds more context to traces
  keepUnusedDataFor: 60,
});
