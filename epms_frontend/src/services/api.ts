// services/api.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQueryWithReauth";

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Employee",
    "Profile",
    "Department",
    "Role",
    "JobLevel",
    "Position",
    "EmployeeDepartment",
    "Permission",
    "RoleLevelPermission",
    "ContinuousFeedback",
    "FeedbackTag",
    "OneOnOneMeeting",
    "FeedbackReply",
    "MeetingComment",
    "PIP",
    "PipObjective",
    "PipProgress",
    "PipReview",
    "Form",
    "Cycle",
    "Appraisal",
    "Teams",
    "TeamMembers",
    "EmployeeTeams",
    "Library",
    "GoalSet",
    "Progress",
    "Score",
    "Category",
    "Feedback360",
    "FeedbackRequest",
    "FeedbackSubmission",
    "FeedbackSummary",
    "FeedbackConfig",
    "Feedback"
  ],
  endpoints: () => ({}),
  // This adds more context to traces
  keepUnusedDataFor: 60,
});
