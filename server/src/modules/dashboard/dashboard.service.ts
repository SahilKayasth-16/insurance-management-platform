import prisma from "../../lib/prisma.js";
import { getLast12MonthsList, getMonthNames } from "./dashboard.utils.js";
import type {
    AdminDashboardResponse,
    AgentDashboardResponse,
    MonthlyReportResponse,
} from "./dashboard.types.js";

/**
 * Get analytics statistics for Admin Dashboard.
 */
export const getAdminDashboardStats = async (): Promise<AdminDashboardResponse> => {
    // 1. Customer count
    const customersCount = await prisma.customer.count();

    // 2. Agent count
    const agentsCount = await prisma.user.count({
        where: { role: "AGENT" }
    });

    // 3. Policies count
    const policiesCount = await prisma.policy.count();
    const activePoliciesCount = await prisma.policy.count({
        where: { status: "ACTIVE" }
    });
    const expiredPoliciesCount = await prisma.policy.count({
        where: { status: "EXPIRED" }
    });
    const cancelledPoliciesCount = await prisma.policy.count({
        where: { status: "CANCELLED" }
    });

    // 4. Claims stats
    const claimCounts = await prisma.claim.groupBy({
        by: ["status"],
        _count: { id: true }
    });

    let totalClaims = 0;
    let pendingClaims = 0;
    let approvedClaims = 0;
    let rejectedClaims = 0;

    for (const group of claimCounts) {
        const count = group._count.id;
        totalClaims += count;
        if (group.status === "PENDING") {
            pendingClaims = count;
        } else if (group.status === "APPROVED") {
            approvedClaims = count;
        } else if (group.status === "REJECTED") {
            rejectedClaims = count;
        }
    }

    // 5. Premium stats
    const totalCollectedResult = await prisma.premiumPayment.aggregate({
        where: { status: "PAID" },
        _sum: { amount: true }
    });

    const pendingAmountResult = await prisma.premiumPayment.aggregate({
        where: { status: "PENDING" },
        _sum: { amount: true }
    });

    const today = new Date();
    const overdueAmountResult = await prisma.premiumPayment.aggregate({
        where: {
            status: "PENDING",
            dueDate: { lt: today }
        },
        _sum: { amount: true }
    });

    const totalCollected = Number(totalCollectedResult._sum.amount || 0);
    const pendingAmount = Number(pendingAmountResult._sum.amount || 0);
    const overdueAmount = Number(overdueAmountResult._sum.amount || 0);

    // 6. Monthly Growth (last 12 months)
    const months = getLast12MonthsList();
    const firstMonth = months[0];
    const lastMonth = months[11];
    
    const startDate = new Date(firstMonth.year, firstMonth.monthIdx, 1);
    const endDate = new Date(lastMonth.year, lastMonth.monthIdx + 1, 0, 23, 59, 59, 999);

    const customers = await prisma.customer.findMany({
        where: {
            createdAt: {
                gte: startDate,
                lte: endDate
            }
        },
        select: { createdAt: true }
    });

    const policies = await prisma.policy.findMany({
        where: {
            createdAt: {
                gte: startDate,
                lte: endDate
            }
        },
        select: { createdAt: true }
    });

    const premiumPayments = await prisma.premiumPayment.findMany({
        where: {
            status: "PAID",
            paymentDate: {
                gte: startDate,
                lte: endDate
            }
        },
        select: {
            amount: true,
            paymentDate: true
        }
    });

    const monthlyGrowth = months.map(m => {
        const cCount = customers.filter(c => {
            const d = new Date(c.createdAt);
            return d.getFullYear() === m.year && d.getMonth() === m.monthIdx;
        }).length;

        const pCount = policies.filter(p => {
            const d = new Date(p.createdAt);
            return d.getFullYear() === m.year && d.getMonth() === m.monthIdx;
        }).length;

        const premiumSum = premiumPayments.reduce((sum, p) => {
            if (!p.paymentDate) return sum;
            const d = new Date(p.paymentDate);
            if (d.getFullYear() === m.year && d.getMonth() === m.monthIdx) {
                return sum + Number(p.amount);
            }
            return sum;
        }, 0);

        return {
            month: m.label,
            customers: cCount,
            policies: pCount,
            premium: premiumSum
        };
    });

    return {
        customers: customersCount,
        agents: agentsCount,
        policies: policiesCount,
        activePolicies: activePoliciesCount,
        expiredPolicies: expiredPoliciesCount,
        cancelledPolicies: cancelledPoliciesCount,
        claims: {
            total: totalClaims,
            pending: pendingClaims,
            approved: approvedClaims,
            rejected: rejectedClaims
        },
        premium: {
            totalCollected,
            pendingAmount,
            overdueAmount
        },
        monthlyGrowth
    };
};

/**
 * Get analytics statistics for Agent Dashboard.
 */
export const getAgentDashboardStats = async (agentId: string): Promise<AgentDashboardResponse> => {
    // 1. Assigned Policies count
    const assignedPolicies = await prisma.policy.count({
        where: { agentId }
    });
    const activePolicies = await prisma.policy.count({
        where: { agentId, status: "ACTIVE" }
    });
    const expiredPolicies = await prisma.policy.count({
        where: { agentId, status: "EXPIRED" }
    });
    const cancelledPolicies = await prisma.policy.count({
        where: { agentId, status: "CANCELLED" }
    });

    // 2. Claims on policies assigned to agent
    const claimCounts = await prisma.claim.groupBy({
        by: ["status"],
        where: {
            policy: { agentId }
        },
        _count: { id: true }
    });

    let pendingClaims = 0;
    let approvedClaims = 0;
    let rejectedClaims = 0;

    for (const group of claimCounts) {
        const count = group._count.id;
        if (group.status === "PENDING") {
            pendingClaims = count;
        } else if (group.status === "APPROVED") {
            approvedClaims = count;
        } else if (group.status === "REJECTED") {
            rejectedClaims = count;
        }
    }

    // 3. Premium collected on policies assigned to agent
    const premiumCollectedResult = await prisma.premiumPayment.aggregate({
        where: {
            status: "PAID",
            policy: { agentId }
        },
        _sum: { amount: true }
    });

    const premiumCollected = Number(premiumCollectedResult._sum.amount || 0);

    return {
        assignedPolicies,
        activePolicies,
        expiredPolicies,
        cancelledPolicies,
        claims: {
            pending: pendingClaims,
            approved: approvedClaims,
            rejected: rejectedClaims
        },
        premiumCollected
    };
};

/**
 * Get Monthly Report for a specific year.
 */
export const getMonthlyReport = async (year: number): Promise<MonthlyReportResponse> => {
    const startDate = new Date(year, 0, 1, 0, 0, 0, 0);
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

    // 1. Fetch data in parallel for the whole year
    const [customers, policies, claims, premiumPayments] = await Promise.all([
        prisma.customer.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            },
            select: { createdAt: true }
        }),
        prisma.policy.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            },
            select: { createdAt: true }
        }),
        prisma.claim.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            },
            select: { createdAt: true }
        }),
        prisma.premiumPayment.findMany({
            where: {
                status: "PAID",
                paymentDate: {
                    gte: startDate,
                    lte: endDate
                }
            },
            select: {
                amount: true,
                paymentDate: true
            }
        })
    ]);

    // 2. Format into 12 months array
    const monthNames = getMonthNames();
    const months = monthNames.map((name, idx) => {
        const cCount = customers.filter(c => new Date(c.createdAt).getMonth() === idx).length;
        const pCount = policies.filter(p => new Date(p.createdAt).getMonth() === idx).length;
        const clCount = claims.filter(cl => new Date(cl.createdAt).getMonth() === idx).length;
        const premiumSum = premiumPayments.reduce((sum, p) => {
            if (!p.paymentDate) return sum;
            const d = new Date(p.paymentDate);
            if (d.getMonth() === idx) {
                return sum + Number(p.amount);
            }
            return sum;
        }, 0);

        return {
            month: name,
            customers: cCount,
            policies: pCount,
            claims: clCount,
            premium: premiumSum
        };
    });

    return {
        year,
        months
    };
};
