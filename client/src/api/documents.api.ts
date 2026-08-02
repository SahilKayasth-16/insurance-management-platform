import axiosInstance from "./axios.js";
import type { DocumentRecord, DocumentType, PaginatedResponse, SingleResponse } from "../types/business.js";

export interface DocumentsQuery {
    page?: number;
    limit?: number;
    search?: string;
    sort?: string;
    order?: "asc" | "desc";
    documentType?: DocumentType;
    customerId?: string;
    policyId?: string;
    claimId?: string;
}

export const getDocumentsApi = async (query: DocumentsQuery): Promise<PaginatedResponse<DocumentRecord>> => {
    const response = await axiosInstance.get<PaginatedResponse<DocumentRecord>>("/documents", { params: query });
    return response.data;
};

export const getDocumentApi = async (id: string): Promise<SingleResponse<DocumentRecord>> => {
    const response = await axiosInstance.get<SingleResponse<DocumentRecord>>(`/documents/${id}`);
    return response.data;
};

export const uploadDocumentApi = async (formData: FormData): Promise<SingleResponse<DocumentRecord>> => {
    const response = await axiosInstance.post<SingleResponse<DocumentRecord>>("/documents", formData, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    });
    return response.data;
};

export const deleteDocumentApi = async (id: string): Promise<SingleResponse<null>> => {
    const response = await axiosInstance.delete<SingleResponse<null>>(`/documents/${id}`);
    return response.data;
};
