export interface ClaimsStats {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
}

interface AgentClaimsStats {
    pending: number;
    approved: number;
    rejected: number;
}

export interface PremiumStats {
    totalCollected: number;
    pendingAmount: number;
    overdueAmount: number;
}

export interface MonthlyGrowthItem {
    month: string;
    customers: number;
    policies: number;
    premium: number;
}

export interface AdminDashboardResponse {
    customers: number;
    agents: number;
    policies: number;
    activePolicies: number;
    expiredPolicies: number;
    cancelledPolicies: number;
    claims: ClaimsStats;
    premium: PremiumStats;
    monthlyGrowth: MonthlyGrowthItem[];
}

export interface AgentDashboardResponse {
    assignedPolicies: number;
    activePolicies: number;
    expiredPolicies: number;
    cancelledPolicies: number;
    claims: AgentClaimsStats;
    premiumCollected: number;
}

export interface MonthlyReportItem {
    month: string;
    customers: number;
    policies: number;
    claims: number;
    premium: number;
}

export interface MonthlyReportResponse {
    year: number;
    months: MonthlyReportItem[];
}
