import axiosInstance from "./axios.js";
import type { User } from "../types/auth.js";
import type { PaginatedResponse, SingleResponse } from "../types/business.js";

export interface UsersQuery {
    page?: number;
    limit?: number;
    search?: string;
    sort?: string;
    order?: "asc" | "desc";
}

export interface CreateAgentRequest {
    name: string;
    email: string;
    password: string;
}

export const getUsersApi = async (query: UsersQuery): Promise<PaginatedResponse<User>> => {
    const response = await axiosInstance.get<PaginatedResponse<User>>("/users", { params: query });
    return response.data;
};

export const getUserApi = async (id: string): Promise<SingleResponse<User>> => {
    const response = await axiosInstance.get<SingleResponse<User>>(`/users/${id}`);
    return response.data;
};

export const createAgentApi = async (data: CreateAgentRequest): Promise<SingleResponse<User>> => {
    const response = await axiosInstance.post<SingleResponse<User>>("/users/agents", data);
    return response.data;
};

export const updateUserStatusApi = async (id: string, isActive: boolean): Promise<SingleResponse<User>> => {
    const response = await axiosInstance.patch<SingleResponse<User>>(`/users/${id}/status`, { isActive });
    return response.data;
};
