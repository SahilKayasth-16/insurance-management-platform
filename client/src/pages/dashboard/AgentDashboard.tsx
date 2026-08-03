import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { FiShield, FiFileText, FiDollarSign, FiClock, FiUsers, FiTrendingUp, FiCheckCircle } from "react-icons/fi";

import { getAgentDashboardApi } from "../../api/dashboard.api.js";
import { getPoliciesApi } from "../../api/policies.api.js";
import { getClaimsApi } from "../../api/claims.api.js";
import { getPaymentsApi } from "../../api/payments.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import type { AgentDashboardStats } from "../../api/dashboard.api.js";
import type { Policy, Claim } from "../../types/business.js";

import { StatCard } from "../../components/dashboard/StatCard.js";
import { ChartCard } from "../../components/dashboard/ChartCard.js";
import { AnalyticsSkeleton } from "../../components/dashboard/AnalyticsSkeleton.js";
import { LineChart, BarChart, DoughnutChart, PieChart } from "../../components/dashboard/Charts.js";

export const AgentDashboard: React.FC = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<AgentDashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    // Dynamic aggregated counts
    const [assignedCustomersCount, setAssignedCustomersCount] = useState(0);
    const [monthlySales, setMonthlySales] = useState<number[]>(new Array(12).fill(0));
    const [monthlyCollections, setMonthlyCollections] = useState<number[]>(new Array(12).fill(0));

    // Widgets states
    const [recentPolicies, setRecentPolicies] = useState<Policy[]>([]);
    const [pendingClaims, setPendingClaims] = useState<Claim[]>([]);
    const [upcomingRenewals, setUpcomingRenewals] = useState<Policy[]>([]);
    const [widgetLoading, setWidgetLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user?.id) return;
            try {
                // 1. Fetch dashboard metrics
                const statsRes = await getAgentDashboardApi();
                if (statsRes.success) {
                    setStats(statsRes.data);
                }

                // 2. Fetch agent's policies (first 100) to resolve unique customers and sales trend
                const policiesRes = await getPoliciesApi({ agentId: user.id, limit: 100 });
                if (policiesRes.success && policiesRes.data.policies) {
                    const uniqueCusts = new Set<string>();
                    const salesTrend = new Array(12).fill(0);
                    
                    policiesRes.data.policies.forEach((p: any) => {
                        if (p.customerId) uniqueCusts.add(p.customerId);
                        
                        const date = new Date(p.createdAt);
                        salesTrend[date.getMonth()] += 1;
                    });
                    
                    setAssignedCustomersCount(uniqueCusts.size);
                    setMonthlySales(salesTrend);

                    // Filter upcoming renewals: status is ACTIVE and sorted by endDate ascending
                    const activePols = policiesRes.data.policies
                        .filter((p: any) => p.status === "ACTIVE")
                        .sort((a: any, b: any) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
                        .slice(0, 5);
                    setUpcomingRenewals(activePols);
                    setRecentPolicies(policiesRes.data.policies.slice(0, 5));
                }

                // 3. Fetch agent's payments (first 100) to construct collections trend
                const paymentsRes = await getPaymentsApi({ limit: 100 });
                if (paymentsRes.success && paymentsRes.data.payments) {
                    const collectionsTrend = new Array(12).fill(0);
                    paymentsRes.data.payments.forEach((pay: any) => {
                        if (pay.status === "PAID" && pay.paymentDate) {
                            const date = new Date(pay.paymentDate);
                            collectionsTrend[date.getMonth()] += Number(pay.amount || 0);
                        }
                    });
                    setMonthlyCollections(collectionsTrend);
                }

                // 4. Fetch pending claims
                const claimsRes = await getClaimsApi({ status: "PENDING", limit: 5 });
                if (claimsRes.success) {
                    setPendingClaims(claimsRes.data.claims || []);
                }

            } catch (err: any) {
                toast.error(err.message || "Failed to load agent analytics.");
            } finally {
                setLoading(false);
                setWidgetLoading(false);
            }
        };

        fetchDashboardData();
    }, [user?.id]);

    if (loading) {
        return <AnalyticsSkeleton />;
    }

    const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    return (
        <div className="space-y-8 font-sans">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 m-0">
                    Agent Workspace Dashboard
                </h1>
                <p className="mt-1 text-sm text-slate-500 font-semibold">
                    Review assigned policyholders, track premium commissions, and process pending claim filings.
                </p>
            </div>

            {/* KPI Grid */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {/* Customers */}
                <StatCard
                    title="Assigned Customers"
                    value={assignedCustomersCount}
                    icon={<FiUsers className="h-6 w-6 text-emerald-600" />}
                    description="Unique Policyholders"
                    colorClass="bg-emerald-50/50 border-emerald-100/60"
                />

                {/* Policies */}
                <StatCard
                    title="Assigned Policies"
                    value={stats?.assignedPolicies || 0}
                    icon={<FiShield className="h-6 w-6 text-sky-600" />}
                    description={`${stats?.activePolicies || 0} Active Policy Certificates`}
                    colorClass="bg-sky-50/50 border-sky-100/60"
                />

                {/* Claims pending */}
                <StatCard
                    title="Claims Pending Review"
                    value={stats?.claims?.pending || 0}
                    icon={<FiFileText className="h-6 w-6 text-amber-600" />}
                    description={`${stats?.claims?.approved || 0} Approved Claims`}
                    colorClass="bg-amber-50/50 border-amber-100/60"
                />

                {/* Premium Collected */}
                <StatCard
                    title="Premium Collected"
                    value={`$${Number(stats?.premiumCollected || 0).toLocaleString()}`}
                    icon={<FiDollarSign className="h-6 w-6 text-indigo-600" />}
                    description="On Managed Accounts"
                    colorClass="bg-indigo-50/50 border-indigo-100/60"
                />
            </div>

            {/* Extra mini KPI counters */}
            <div className="grid gap-4 sm:grid-cols-3 text-slate-600">
                <div className="bg-white/60 backdrop-blur-sm border border-slate-200/50 rounded-xl p-4 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Pending Renewals</span>
                    <span className="text-lg font-bold text-yellow-600 mt-1 block">{stats?.expiredPolicies || 0}</span>
                </div>
                <div className="bg-white/60 backdrop-blur-sm border border-slate-200/50 rounded-xl p-4 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Cancelled Policy Contracts</span>
                    <span className="text-lg font-bold text-rose-500 mt-1 block">{stats?.cancelledPolicies || 0}</span>
                </div>
                <div className="bg-white/60 backdrop-blur-sm border border-slate-200/50 rounded-xl p-4 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Claims Rejected</span>
                    <span className="text-lg font-bold text-slate-500 mt-1 block">{stats?.claims?.rejected || 0}</span>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Policies sales distribution */}
                <ChartCard title="Assigned Policies Overview" icon={<FiShield />}>
                    <DoughnutChart
                        labels={["Active", "Expired", "Cancelled"]}
                        datasets={[
                            {
                                data: [stats?.activePolicies || 0, stats?.expiredPolicies || 0, stats?.cancelledPolicies || 0],
                                backgroundColor: ["#10b981", "#64748b", "#f43f5e"],
                                borderColor: ["#ffffff", "#ffffff", "#ffffff"],
                                borderWidth: 2
                            }
                        ]}
                    />
                </ChartCard>

                {/* Claims Evaluated */}
                <ChartCard title="Claims Reviewed Summary" icon={<FiFileText />}>
                    <PieChart
                        labels={["Approved", "Pending", "Rejected"]}
                        datasets={[
                            {
                                data: [stats?.claims?.approved || 0, stats?.claims?.pending || 0, stats?.claims?.rejected || 0],
                                backgroundColor: ["#10b981", "#f59e0b", "#f43f5e"],
                                borderColor: ["#ffffff", "#ffffff", "#ffffff"],
                                borderWidth: 2
                            }
                        ]}
                    />
                </ChartCard>

                {/* Premium Collection Monthly */}
                <ChartCard title="Monthly Premium Revenue Stream" icon={<FiDollarSign />} className="md:col-span-2">
                    <LineChart
                        labels={monthLabels}
                        datasets={[
                            {
                                label: "Collections ($)",
                                data: monthlyCollections,
                                backgroundColor: "rgba(129, 140, 248, 0.15)",
                                borderColor: "#4f46e5",
                                borderWidth: 2.5,
                                fill: true
                            }
                        ]}
                    />
                </ChartCard>

                {/* Policies sales acquisition monthly */}
                <ChartCard title="Monthly Policy Sales" icon={<FiTrendingUp />} className="md:col-span-2">
                    <BarChart
                        labels={monthLabels}
                        datasets={[
                            {
                                label: "Policies Sold",
                                data: monthlySales,
                                backgroundColor: "#38bdf8",
                                borderColor: "#0284c7",
                                borderWidth: 1
                            }
                        ]}
                    />
                </ChartCard>
            </div>

            {/* Tables / Lists widgets */}
            <div className="grid gap-6 md:grid-cols-3">
                {/* Recent policies */}
                <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/50 p-6 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider m-0">Recent Policies</h4>
                        <Link to="/agent/policies" className="text-[10px] font-bold text-sky-600 hover:text-sky-800 uppercase">View All</Link>
                    </div>
                    <div className="space-y-3">
                        {widgetLoading ? (
                            <div className="text-xs text-slate-400 text-center py-4">Loading...</div>
                        ) : recentPolicies.length === 0 ? (
                            <div className="text-xs text-slate-400 text-center py-4">No records.</div>
                        ) : (
                            recentPolicies.map((p) => (
                                <div key={p.id} className="flex justify-between items-center text-xs font-semibold p-2.5 rounded-lg bg-slate-50/50 border border-slate-100">
                                    <div>
                                        <span className="text-slate-800 font-bold block">{p.policyNumber}</span>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase block">{p.policyType}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-slate-700 font-bold block">${Number(p.premiumAmount).toLocaleString()}</span>
                                        <span className={`inline-block rounded-full px-1.5 py-0.5 text-[9px] font-bold mt-0.5 ${
                                            p.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                                        }`}>{p.status}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Pending claims reviews */}
                <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/50 p-6 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider m-0">Pending Claims</h4>
                        <Link to="/agent/claims" className="text-[10px] font-bold text-sky-600 hover:text-sky-800 uppercase">View All</Link>
                    </div>
                    <div className="space-y-3">
                        {widgetLoading ? (
                            <div className="text-xs text-slate-400 text-center py-4">Loading...</div>
                        ) : pendingClaims.length === 0 ? (
                            <div className="text-xs text-slate-400 text-center py-4">No pending claims.</div>
                        ) : (
                            pendingClaims.map((c) => (
                                <div key={c.id} className="flex justify-between items-center text-xs font-semibold p-2.5 rounded-lg bg-slate-50/50 border border-slate-100">
                                    <div>
                                        <span className="text-slate-800 font-bold block truncate max-w-[120px]">{c.reason}</span>
                                        <span className="text-[10px] text-slate-400 font-bold block">{c.policy?.policyNumber}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-slate-700 font-bold block">${Number(c.claimAmount).toLocaleString()}</span>
                                        <span className="inline-block rounded-full px-1.5 py-0.5 text-[9px] font-bold mt-0.5 bg-amber-50 text-amber-700">PENDING</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Upcoming renewals */}
                <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/50 p-6 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider m-0">Upcoming Renewals</h4>
                        <Link to="/agent/policies" className="text-[10px] font-bold text-sky-600 hover:text-sky-800 uppercase">View All</Link>
                    </div>
                    <div className="space-y-3">
                        {widgetLoading ? (
                            <div className="text-xs text-slate-400 text-center py-4">Loading...</div>
                        ) : upcomingRenewals.length === 0 ? (
                            <div className="text-xs text-slate-400 text-center py-4">No upcoming renewals.</div>
                        ) : (
                            upcomingRenewals.map((r) => (
                                <div key={r.id} className="flex justify-between items-center text-xs font-semibold p-2.5 rounded-lg bg-slate-50/50 border border-slate-100">
                                    <div>
                                        <span className="text-slate-800 font-bold block">{r.policyNumber}</span>
                                        <span className="text-[10px] text-slate-400 font-bold block">Exp: {new Date(r.endDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-slate-700 font-bold block">${Number(r.premiumAmount).toLocaleString()}</span>
                                        <span className="inline-block rounded-full px-1.5 py-0.5 text-[9px] font-bold mt-0.5 bg-sky-50 text-sky-700">ACTIVE</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgentDashboard;
