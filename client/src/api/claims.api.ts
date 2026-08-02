import axiosInstance from "./axios.js";
import type { Claim, ClaimStatus, PaginatedResponse, SingleResponse } from "../types/business.js";

export interface ClaimsQuery {
    page?: number;
    limit?: number;
    search?: string;
    sort?: string;
    order?: "asc" | "desc";
    status?: ClaimStatus;
    policyId?: string;
    customerId?: string;
    agentId?: string;
}

export interface SubmitClaimRequest {
    policyId: string;
    claimAmount: number;
    reason: string;
    incidentDate: string;
    description: string;
}

export interface ReviewClaimRequest {
    status: "APPROVED" | "REJECTED";
    remarks: string;
}

export const getClaimsApi = async (query: ClaimsQuery): Promise<PaginatedResponse<Claim>> => {
    const response = await axiosInstance.get<PaginatedResponse<Claim>>("/claims", { params: query });
    return response.data;
};

export const getClaimApi = async (id: string): Promise<SingleResponse<Claim>> => {
    const response = await axiosInstance.get<SingleResponse<Claim>>(`/claims/${id}`);
    return response.data;
};

export const submitClaimApi = async (data: SubmitClaimRequest): Promise<SingleResponse<Claim>> => {
    const response = await axiosInstance.post<SingleResponse<Claim>>("/claims", data);
    return response.data;
};

export const reviewClaimApi = async (id: string, data: ReviewClaimRequest): Promise<SingleResponse<Claim>> => {
    const response = await axiosInstance.patch<SingleResponse<Claim>>(`/claims/${id}/review`, data);
    return response.data;
};
