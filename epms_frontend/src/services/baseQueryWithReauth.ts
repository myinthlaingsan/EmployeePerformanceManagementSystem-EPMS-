import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { toast } from "react-toastify";
import type { RootState } from "../app/store";
import { logout, setTokens } from "../features/auth/authSlice";
import type { AuthResponse } from "../features/auth/authTypes";
import type { ApiResponse } from "./ApiResponse";
import { baseQuery } from "./baseQuery";

type ErrorPayload = {
  message?: string;
  data?: Record<string, string>;
};

const getRequestUrl = (args: string | FetchArgs): string =>
  typeof args === "string" ? args : args.url;

const extractMessage = (error: FetchBaseQueryError): string => {
  if (error.status === "FETCH_ERROR") {
    return "Network error: Unable to reach the server. Check your connection.";
  }
  if (error.status === "PARSING_ERROR") {
    return "Server returned an unexpected response.";
  }

  const data = error.data as ErrorPayload | undefined;
  return data?.message || "An unexpected error occurred.";
};

const getStatusPrefix = (status: number | string): string => {
  switch (status) {
    case 400:
      return "Bad Request";
    case 401:
      return "Session Expired";
    case 403:
      return "Access Denied";
    case 404:
      return "Not Found";
    case 409:
      return "Conflict";
    case 422:
      return "Validation Error";
    case 423:
      return "Account Locked";
    case 500:
      return "Server Error";
    default:
      return "Error";
  }
};

const shouldShowToast = (status: number | string, url: string): boolean => {
  if (url.includes("/auth/me") && status === 401) return false;
  if (url.includes("/auth/login")) return false;
  if (
    status === 404 &&
    (url.includes("/kpi/active-cycle") || url.includes("/appraisal-cycles/active"))
  ) {
    return false;
  }
  return true;
};

const redirectToLogin = () => {
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
};

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  const url = getRequestUrl(args);

  if (!result.error || url === "/auth/refresh-token") {
    return result;
  }

  const status = result.error.status;
  const message = extractMessage(result.error);

  if (status === 401) {
    const refreshToken = (api.getState() as RootState).auth.refreshToken;

    if (refreshToken && !url.includes("/auth/")) {
      const refreshResult = await baseQuery(
        {
          url: "/auth/refresh-token",
          method: "POST",
          body: { refreshToken },
          headers: { Authorization: "" },
        },
        api,
        extraOptions,
      );

      if (refreshResult.data) {
        const data = (refreshResult.data as ApiResponse<AuthResponse>).data;
        api.dispatch(setTokens(data));
        result = await baseQuery(args, api, extraOptions);
        return result;
      }

      api.dispatch(logout());
      toast.error("Your session has expired. Please log in again.", {
        toastId: "session-expired",
      });
      redirectToLogin();
      return result;
    }

    if (shouldShowToast(status, url)) {
      toast.error(`${getStatusPrefix(status)}: ${message}`, {
        toastId: "auth-error",
      });
    }
    return result;
  }

  if (status === 403) {
    toast.error(`${getStatusPrefix(status)}: ${message}`, {
      toastId: `forbidden-${url}`,
      autoClose: 5000,
    });
    return result;
  }

  if (status === 423) {
    if (shouldShowToast(status, url)) {
      toast.error(`${getStatusPrefix(status)}: ${message}`, {
        autoClose: 8000,
      });
    }
    return result;
  }

  if (status === 422) {
    const data = result.error.data as ErrorPayload | undefined;
    const fieldErrors = data?.data;

    if (fieldErrors && Object.keys(fieldErrors).length > 0) {
      const details = Object.entries(fieldErrors)
        .map(([field, errorMessage]) => `${field}: ${errorMessage}`)
        .join("\n");
      toast.warning(`Validation failed:\n${details}`, { autoClose: 6000 });
    } else {
      toast.warning(`${getStatusPrefix(status)}: ${message}`);
    }
    return result;
  }

  if (status === 409) {
    toast.warning(`${getStatusPrefix(status)}: ${message}`);
    return result;
  }

  if (status === 404) {
    if (shouldShowToast(status, url)) {
      toast.error(`${getStatusPrefix(status)}: ${message}`);
    }
    return result;
  }

  if (typeof status === "number" && status >= 500) {
    toast.error(`${getStatusPrefix(status)}: ${message}`, {
      autoClose: 7000,
    });
    return result;
  }

  if (status === "FETCH_ERROR") {
    toast.error(message, { toastId: "network-error" });
  }

  return result;
};
