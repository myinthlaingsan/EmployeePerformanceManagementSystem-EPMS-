import type { EmployeeResponse } from "../employee/employeeTypes";

export interface AuthRequest{
    email:string;
    password:string;
}

export interface AuthResponse{
    accessToken: string;
    refreshToken: string;
}

export interface RefreshTokenRequest{
    refreshToken: string;
}

export interface AuthState{
    user: EmployeeResponse | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
}