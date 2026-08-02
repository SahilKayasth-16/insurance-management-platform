import axiosInstance from "./axios.js";
import type { PremiumPayment, PaymentStatus, PaymentMethod, PaginatedResponse, SingleResponse } from "../types/business.js";

export interface PaymentsQuery {
    page?: number;
    limit?: number;
    search?: string;
    sort?: string;
    order?: "asc" | "desc";
    status?: PaymentStatus;
    paymentMethod?: PaymentMethod;
    policyId?: string;
    customerId?: string;
    agentId?: string;
    fromDate?: string;
    toDate?: string;
}

export interface RecordPaymentRequest {
    policyId: string;
    amount: number;
    paymentDate: string;
    paymentMethod: PaymentMethod;
    transactionId?: string;
}

export const getPaymentsApi = async (query: PaymentsQuery): Promise<PaginatedResponse<PremiumPayment>> => {
    const response = await axiosInstance.get<PaginatedResponse<PremiumPayment>>("/payments", { params: query });
    return response.data;
};

export const getPaymentApi = async (id: string): Promise<SingleResponse<PremiumPayment>> => {
    const response = await axiosInstance.get<SingleResponse<PremiumPayment>>(`/payments/${id}`);
    return response.data;
};

export const recordPaymentApi = async (data: RecordPaymentRequest): Promise<SingleResponse<PremiumPayment>> => {
    const response = await axiosInstance.post<SingleResponse<PremiumPayment>>("/payments", data);
    return response.data;
};
