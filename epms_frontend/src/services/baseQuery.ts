import { fetchBaseQuery } from "@reduxjs/toolkit/query";
import type { RootState } from "../app/store";

export const baseQuery = fetchBaseQuery({
    baseUrl: "http://localhost:8080/api/v1",
    credentials: "include",
    prepareHeaders: (headers, { getState }) => {
        const token = (getState() as RootState).auth.accessToken;

        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
        }
        return headers;
    }
})