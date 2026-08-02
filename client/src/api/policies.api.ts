import axiosInstance from "./axios.js";
import type { Policy, PolicyType, PolicyStatus, PaginatedResponse, SingleResponse } from "../types/business.js";

export interface PoliciesQuery {
    page?: number;
    limit?: number;
    search?: string;
    sort?: string;
    order?: "asc" | "desc";
    status?: PolicyStatus;
    policyType?: PolicyType;
    agentId?: string;
    customerId?: string;
}

export interface CreatePolicyRequest {
    customerId: string;
    agentId: string;
    policyType: PolicyType;
    coverageAmount: number;
    premiumAmount: number;
    startDate: string;
    endDate: string;
}

export interface UpdatePolicyRequest {
    coverageAmount?: number;
    premiumAmount?: number;
    endDate?: string;
}

export const getPoliciesApi = async (query: PoliciesQuery): Promise<PaginatedResponse<Policy>> => {
    const response = await axiosInstance.get<PaginatedResponse<Policy>>("/policies", { params: query });
    return response.data;
};

export const getPolicyApi = async (id: string): Promise<SingleResponse<Policy>> => {
    const response = await axiosInstance.get<SingleResponse<Policy>>(`/policies/${id}`);
    return response.data;
};

export const createPolicyApi = async (data: CreatePolicyRequest): Promise<SingleResponse<Policy>> => {
    const response = await axiosInstance.post<SingleResponse<Policy>>("/policies", data);
    return response.data;
};

export const updatePolicyApi = async (id: string, data: UpdatePolicyRequest): Promise<SingleResponse<Policy>> => {
    const response = await axiosInstance.patch<SingleResponse<SingleResponse<Policy>>>(`/policies/${id}`, data);
    // Wait, the backend controller updates the policy and returns it inside data.
    // Let's type it correctly to support the return payload.
    return response.data as any;
};

export const renewPolicyApi = async (id: string, endDate: string): Promise<SingleResponse<Policy>> => {
    const response = await axiosInstance.patch<SingleResponse<Policy>>(`/policies/${id}/renew`, { endDate });
    return response.data;
};

export const cancelPolicyApi = async (id: string): Promise<SingleResponse<Policy>> => {
    const response = await axiosInstance.patch<SingleResponse<Policy>>(`/policies/${id}/cancel`);
    return response.data;
};
