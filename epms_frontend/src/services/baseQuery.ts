import { fetchBaseQuery } from "@reduxjs/toolkit/query";
import type { RootState } from "../app/store";

export const baseQuery = fetchBaseQuery({
    baseUrl: "http://localhost:8080/api/v1",
    // baseUrl: "https://dash-murmuring-symphony.ngrok-free.dev/api/v1",
    credentials: "include",
    prepareHeaders: (headers, { getState }) => {
        const token = (getState() as RootState).auth.accessToken;
        // 2. Add the skip-warning header for ngrok
        headers.set("ngrok-skip-browser-warning", "true");
        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
        }
        return headers;
    }
})