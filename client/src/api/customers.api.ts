import axiosInstance from "./axios.js";
import type { Customer, PaginatedResponse, SingleResponse } from "../types/business.js";

export interface CustomersQuery {
    page?: number;
    limit?: number;
    search?: string;
    sort?: string;
    order?: "asc" | "desc";
}

export interface CreateCustomerRequest {
    userId: string;
    dob: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    identityNumber?: string | null;
}

export interface UpdateCustomerRequest {
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    identityNumber?: string | null;
}

export const getCustomersApi = async (query: CustomersQuery): Promise<PaginatedResponse<Customer>> => {
    const response = await axiosInstance.get<PaginatedResponse<Customer>>("/customers", { params: query });
    return response.data;
};

export const getCustomerApi = async (id: string): Promise<SingleResponse<Customer>> => {
    const response = await axiosInstance.get<SingleResponse<Customer>>(`/customers/${id}`);
    return response.data;
};

export const createCustomerApi = async (data: CreateCustomerRequest): Promise<SingleResponse<Customer>> => {
    const response = await axiosInstance.post<SingleResponse<Customer>>("/customers", data);
    return response.data;
};

export const updateCustomerApi = async (id: string, data: UpdateCustomerRequest): Promise<SingleResponse<Customer>> => {
    const response = await axiosInstance.patch<SingleResponse<Customer>>(`/customers/${id}`, data);
    return response.data;
};
