import type { User } from "./auth.js";

export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface PaginatedResponse<T> {
    success: boolean;
    statusCode: number;
    message: string;
    data: {
        users?: T[];
        customers?: T[];
        policies?: T[];
        payments?: T[];
        claims?: T[];
        documents?: T[];
        pagination: PaginationInfo;
    };
}

export interface SingleResponse<T> {
    success: boolean;
    statusCode: number;
    message: string;
    data: T;
}

export interface Customer {
    id: string;
    userId: string;
    dob: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    identityNumber: string | null;
    user?: User;
    createdAt?: string;
    updatedAt?: string;
}

export type PolicyType = "LIFE" | "HEALTH" | "VEHICLE" | "HOME" | "TRAVEL";
export type PolicyStatus = "ACTIVE" | "EXPIRED" | "CANCELLED";

export interface Policy {
    id: string;
    customerId: string;
    agentId: string;
    policyNumber: string;
    policyType: PolicyType;
    coverageAmount: number;
    premiumAmount: number;
    startDate: string;
    endDate: string;
    status: PolicyStatus;
    customer?: Customer;
    agent?: User;
    createdAt?: string;
    updatedAt?: string;
}

export type PaymentStatus = "PENDING" | "PAID" | "OVERDUE" | "FAILED";
export type PaymentMethod = "CASH" | "CARD" | "UPI" | "NET_BANKING" | "CHEQUE";

export interface PremiumPayment {
    id: string;
    amount: number;
    dueDate: string;
    paymentDate: string | null;
    paymentMethod: PaymentMethod | null;
    transactionId: string | null;
    status: PaymentStatus;
    policyId: string;
    policyNumber?: string | null;
    customerName?: string | null;
    createdAt?: string;
}

export type ClaimStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface Claim {
    id: string;
    policyId: string;
    claimAmount: number;
    reason: string;
    description: string;
    incidentDate: string;
    status: ClaimStatus;
    reviewedById: string | null;
    reviewedBy?: User | null;
    reviewedAt: string | null;
    remarks: string | null;
    submissionDate: string;
    policy?: Policy | null;
    customer?: Customer | null;
    agent?: User | null;
    createdAt?: string;
    updatedAt?: string;
}

export type DocumentType = "ID_PROOF" | "ADDRESS_PROOF" | "POLICY" | "CLAIM" | "OTHER";

export interface DocumentRecord {
    id: string;
    customerId: string | null;
    policyId: string | null;
    claimId: string | null;
    documentType: DocumentType;
    fileName: string;
    filePath: string;
    fileType: string;
    uploadedAt: string;
    customer?: Customer | null;
    policy?: Policy | null;
    claim?: Claim | null;
}
