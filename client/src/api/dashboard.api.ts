import axiosInstance from "./axios.js";
import type { SingleResponse } from "../types/business.js";

export interface DashboardClaimStats {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
}

export interface DashboardPremiumStats {
    totalCollected: number;
    pendingAmount: number;
    overdueAmount: number;
}

export interface DashboardGrowthMonth {
    month: string;
    customers: number;
    policies: number;
    premium: number;
}

export interface AdminDashboardStats {
    customers: number;
    agents: number;
    policies: number;
    activePolicies: number;
    expiredPolicies: number;
    cancelledPolicies: number;
    claims: DashboardClaimStats;
    premium: DashboardPremiumStats;
    monthlyGrowth: DashboardGrowthMonth[];
}

export interface AgentDashboardStats {
    customers: number;
    agents: number; // wait, is it in response? Let's check AgentDashboardResponse type on server
    policies: number;
    activePolicies: number;
    expiredPolicies: number;
    cancelledPolicies: number;
    claims: DashboardClaimStats;
    premium: DashboardPremiumStats;
    monthlyGrowth: DashboardGrowthMonth[];
}

export interface MonthlyReportMetric {
    month: string;
    premiumCollected: number;
    claimsSubmitted: number;
    claimsApproved: number;
    claimsPaidAmount: number;
    newCustomersCount: number;
    newPoliciesCount: number;
}

export interface MonthlyReportData {
    year: number;
    metrics: MonthlyReportMetric[];
    totals: {
        totalPremiumCollected: number;
        totalClaimsSubmitted: number;
        totalClaimsApproved: number;
        totalClaimsPaidAmount: number;
        totalNewCustomers: number;
        totalNewPolicies: number;
    };
}

export const getAdminDashboardApi = async (): Promise<SingleResponse<AdminDashboardStats>> => {
    const response = await axiosInstance.get<SingleResponse<AdminDashboardStats>>("/dashboard/admin");
    return response.data;
};

export const getAgentDashboardApi = async (): Promise<SingleResponse<AgentDashboardStats>> => {
    const response = await axiosInstance.get<SingleResponse<AgentDashboardStats>>("/dashboard/agent");
    return response.data;
};

export const getMonthlyReportApi = async (year: number): Promise<SingleResponse<MonthlyReportData>> => {
    const response = await axiosInstance.get<SingleResponse<MonthlyReportData>>("/reports/monthly", { params: { year } });
    return response.data;
};
