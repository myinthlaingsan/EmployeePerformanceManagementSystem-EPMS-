// services/api.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQueryWithReauth";

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Employee","Profile"],
  endpoints: () => ({}),
  // This adds more context to traces
  keepUnusedDataFor: 60,
});
