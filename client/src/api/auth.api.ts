import axiosInstance from "./axios.js";
import type { LoginRequest, LoginResponse, CurrentUserResponse } from "../types/auth.js";

/**
 * Log in a user.
 */
export const loginApi = async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await axiosInstance.post<LoginResponse>("/auth/login", credentials);
    return response.data;
};

/**
 * Log out the current user.
 */
export const logoutApi = async (): Promise<{ success: boolean; message: string }> => {
    const response = await axiosInstance.post<{ success: boolean; message: string }>("/auth/logout");
    return response.data;
};

/**
 * Fetch the authenticated user's profile.
 */
export const getCurrentUserApi = async (): Promise<CurrentUserResponse> => {
    const response = await axiosInstance.get<CurrentUserResponse>("/auth/me");
    return response.data;
};

/**
 * Register a new user account.
 */
export const registerApi = async (data: any): Promise<any> => {
    const response = await axiosInstance.post<any>("/auth/register", data);
    return response.data;
};
