import { fetchBaseQuery } from "@reduxjs/toolkit/query";
import type { RootState } from "../app/store";

export const baseQuery = fetchBaseQuery({
    baseUrl: "http://localhost:8083/api/v1",
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