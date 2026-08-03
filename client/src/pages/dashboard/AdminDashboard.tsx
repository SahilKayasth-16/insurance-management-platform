import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { FiUsers, FiShield, FiFileText, FiTrendingUp, FiActivity, FiDollarSign, FiClock, FiCheckCircle } from "react-icons/fi";

import { getAdminDashboardApi } from "../../api/dashboard.api.js";
import { getPoliciesApi } from "../../api/policies.api.js";
import { getClaimsApi } from "../../api/claims.api.js";
import { getPaymentsApi } from "../../api/payments.api.js";
import { getCustomersApi } from "../../api/customers.api.js";
import type { AdminDashboardStats } from "../../api/dashboard.api.js";
import type { Policy, Claim, PremiumPayment, Customer } from "../../types/business.js";

import { StatCard } from "../../components/dashboard/StatCard.js";
import { ChartCard } from "../../components/dashboard/ChartCard.js";
import { AnalyticsSkeleton } from "../../components/dashboard/AnalyticsSkeleton.js";
import { LineChart, BarChart, DoughnutChart, PieChart } from "../../components/dashboard/Charts.js";

export const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<AdminDashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    // Recent items states
    const [recentPolicies, setRecentPolicies] = useState<Policy[]>([]);
    const [recentClaims, setRecentClaims] = useState<Claim[]>([]);
    const [recentPayments, setRecentPayments] = useState<PremiumPayment[]>([]);
    const [recentCustomers, setRecentCustomers] = useState<Customer[]>([]);
    const [recentLoading, setRecentLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // 1. Fetch main dashboard statistics
                const response = await getAdminDashboardApi();
                if (response.success) {
                    setStats(response.data);
                }

                // 2. Fetch recent data feeds in parallel
                const [policiesRes, claimsRes, paymentsRes, customersRes] = await Promise.all([
                    getPoliciesApi({ limit: 5 }),
                    getClaimsApi({ limit: 5 }),
                    getPaymentsApi({ limit: 5 }),
                    getCustomersApi({ limit: 5 })
                ]);

                if (policiesRes.success) setRecentPolicies(policiesRes.data.policies || []);
                if (claimsRes.success) setRecentClaims(claimsRes.data.claims || []);
                if (paymentsRes.success) setRecentPayments(paymentsRes.data.payments || []);
                if (customersRes.success) setRecentCustomers(customersRes.data.customers || []);

            } catch (err: any) {
                toast.error(err.message || "Failed to load dashboard parameters.");
            } finally {
                setLoading(false);
                setRecentLoading(false);
            }
        };
        
        fetchDashboardData();
    }, []);

    if (loading) {
        return <AnalyticsSkeleton />;
    }

    // Growth trend variables
    const growthLabels = stats?.monthlyGrowth.map((g) => g.month) || [];
    const customerGrowthData = stats?.monthlyGrowth.map((g) => g.customers) || [];
    const policyGrowthData = stats?.monthlyGrowth.map((g) => g.policies) || [];
    const revenueGrowthData = stats?.monthlyGrowth.map((g) => g.premium) || [];

    return (
        <div className="space-y-8 font-sans">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 m-0">
                    Admin Analytics Dashboard
                </h1>
                <p className="mt-1 text-sm text-slate-500 font-semibold">
                    Monitor system health, insurance policies distribution, revenue trends, and operational workflows.
                </p>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {/* Customers Count */}
                <StatCard
                    title="Total Customers"
                    value={stats?.customers || 0}
                    icon={<FiUsers className="h-6 w-6 text-sky-600" />}
                    description="Registered Clients"
                    colorClass="bg-sky-50/50 border-sky-100/60"
                />

                {/* Policies KPI */}
                <StatCard
                    title="Active Policies"
                    value={`${stats?.activePolicies || 0}`}
                    icon={<FiShield className="h-6 w-6 text-emerald-600" />}
                    description={`Out of ${stats?.policies || 0} Total Policies`}
                    colorClass="bg-emerald-50/50 border-emerald-100/60"
                />

                {/* Claims KPI */}
                <StatCard
                    title="Pending Claims"
                    value={stats?.claims?.pending || 0}
                    icon={<FiFileText className="h-6 w-6 text-amber-600" />}
                    description={`${stats?.claims?.approved || 0} Approved, ${stats?.claims?.rejected || 0} Rejected`}
                    colorClass="bg-amber-50/50 border-amber-100/60"
                />

                {/* Premium Collected KPI */}
                <StatCard
                    title="Premium Collected"
                    value={`$${Number(stats?.premium?.totalCollected || 0).toLocaleString()}`}
                    icon={<FiTrendingUp className="h-6 w-6 text-indigo-600" />}
                    description={`$${Number(stats?.premium?.pendingAmount || 0).toLocaleString()} Dues Pending`}
                    colorClass="bg-indigo-50/50 border-indigo-100/60"
                />
            </div>

            {/* Extra KPI row for fine-grained stats */}
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6 text-slate-600">
                <div className="bg-white/60 backdrop-blur-sm border border-slate-200/50 rounded-xl p-4 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Agents</span>
                    <span className="text-lg font-bold text-slate-800 mt-1 block">{stats?.agents || 0}</span>
                </div>
                <div className="bg-white/60 backdrop-blur-sm border border-slate-200/50 rounded-xl p-4 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Expired Policies</span>
                    <span className="text-lg font-bold text-slate-500 mt-1 block">{stats?.expiredPolicies || 0}</span>
                </div>
                <div className="bg-white/60 backdrop-blur-sm border border-slate-200/50 rounded-xl p-4 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Cancelled Policies</span>
                    <span className="text-lg font-bold text-rose-500 mt-1 block">{stats?.cancelledPolicies || 0}</span>
                </div>
                <div className="bg-white/60 backdrop-blur-sm border border-slate-200/50 rounded-xl p-4 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Claims Submitted</span>
                    <span className="text-lg font-bold text-slate-800 mt-1 block">{stats?.claims?.total || 0}</span>
                </div>
                <div className="bg-white/60 backdrop-blur-sm border border-slate-200/50 rounded-xl p-4 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Overdue Premium</span>
                    <span className="text-lg font-bold text-rose-600 mt-1 block">${Number(stats?.premium?.overdueAmount || 0).toLocaleString()}</span>
                </div>
                <div className="bg-white/60 backdrop-blur-sm border border-slate-200/50 rounded-xl p-4 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Annual Sales Volume</span>
                    <span className="text-lg font-bold text-emerald-600 mt-1 block">${Number(revenueGrowthData.reduce((a, b) => a + b, 0)).toLocaleString()}</span>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* 1. Policy Status Distribution */}
                <ChartCard title="Policy Distribution" icon={<FiShield />}>
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

                {/* 2. Claims status distribution */}
                <ChartCard title="Claims Evaluation Distribution" icon={<FiFileText />}>
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

                {/* 3. Monthly Revenue (Premium collection history) */}
                <ChartCard title="Premium Revenue Trend" icon={<FiDollarSign />} className="md:col-span-2">
                    <LineChart
                        labels={growthLabels}
                        datasets={[
                            {
                                label: "Revenue Collected ($)",
                                data: revenueGrowthData,
                                backgroundColor: "rgba(56, 189, 248, 0.15)",
                                borderColor: "#0284c7",
                                borderWidth: 2.5,
                                fill: true
                            }
                        ]}
                    />
                </ChartCard>

                {/* 4. Customer and Policy Growth */}
                <ChartCard title="Monthly Customer & Policy Acquisition" icon={<FiUsers />}>
                    <BarChart
                        labels={growthLabels}
                        datasets={[
                            {
                                label: "New Customers",
                                data: customerGrowthData,
                                backgroundColor: "#38bdf8",
                                borderColor: "#0284c7",
                                borderWidth: 1
                            },
                            {
                                label: "Policies Issued",
                                data: policyGrowthData,
                                backgroundColor: "#818cf8",
                                borderColor: "#4f46e5",
                                borderWidth: 1
                            }
                        ]}
                    />
                </ChartCard>

                {/* 5. Premium collection summaries */}
                <ChartCard title="Invoiced Premium Collections" icon={<FiTrendingUp />}>
                    <BarChart
                        labels={["Paid", "Pending Dues", "Overdue Dues"]}
                        datasets={[
                            {
                                label: "Volume ($)",
                                data: [
                                    stats?.premium?.totalCollected || 0,
                                    stats?.premium?.pendingAmount || 0,
                                    stats?.premium?.overdueAmount || 0
                                ],
                                backgroundColor: ["#10b981", "#f59e0b", "#f43f5e"],
                                borderColor: ["#059669", "#d97706", "#e11d48"],
                                borderWidth: 1
                            }
                        ]}
                    />
                </ChartCard>
            </div>

            {/* Widgets Section (Tables) */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Recent Policies */}
                <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/50 p-6 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider m-0">Recent Policies</h4>
                        <Link to="/admin/policies" className="text-xs font-bold text-sky-600 hover:text-sky-800">View All</Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-600">
                            <thead>
                                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                                    <th className="pb-2">Policy No</th>
                                    <th className="pb-2">Type</th>
                                    <th className="pb-2 text-right">Premium</th>
                                    <th className="pb-2 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentLoading ? (
                                    <tr><td colSpan={4} className="py-4 text-center text-slate-400">Loading...</td></tr>
                                ) : recentPolicies.length === 0 ? (
                                    <tr><td colSpan={4} className="py-4 text-center text-slate-400">No records.</td></tr>
                                ) : (
                                    recentPolicies.map((p) => (
                                        <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                                            <td className="py-2.5 font-semibold text-slate-700">{p.policyNumber}</td>
                                            <td className="py-2.5 font-medium">{p.policyType}</td>
                                            <td className="py-2.5 text-right font-bold">${Number(p.premiumAmount).toLocaleString()}</td>
                                            <td className="py-2.5 text-center">
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                    p.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                                                }`}>
                                                    {p.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Claims */}
                <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/50 p-6 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider m-0">Recent Claims</h4>
                        <Link to="/admin/claims" className="text-xs font-bold text-sky-600 hover:text-sky-800">View All</Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-600">
                            <thead>
                                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                                    <th className="pb-2">Policy No</th>
                                    <th className="pb-2">Reason</th>
                                    <th className="pb-2 text-right">Value</th>
                                    <th className="pb-2 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentLoading ? (
                                    <tr><td colSpan={4} className="py-4 text-center text-slate-400">Loading...</td></tr>
                                ) : recentClaims.length === 0 ? (
                                    <tr><td colSpan={4} className="py-4 text-center text-slate-400">No records.</td></tr>
                                ) : (
                                    recentClaims.map((c) => (
                                        <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                                            <td className="py-2.5 font-semibold text-slate-700">{c.policy?.policyNumber || "-"}</td>
                                            <td className="py-2.5 font-medium truncate max-w-[100px]">{c.reason}</td>
                                            <td className="py-2.5 text-right font-bold">${Number(c.claimAmount).toLocaleString()}</td>
                                            <td className="py-2.5 text-center">
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                    c.status === "APPROVED" ? "bg-emerald-50 text-emerald-700" :
                                                    c.status === "PENDING" ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"
                                                }`}>
                                                    {c.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Payments */}
                <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/50 p-6 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider m-0">Recent Payments</h4>
                        <Link to="/admin/payments" className="text-xs font-bold text-sky-600 hover:text-sky-800">View All</Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-600">
                            <thead>
                                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                                    <th className="pb-2">Policy No</th>
                                    <th className="pb-2">Due Date</th>
                                    <th className="pb-2 text-right">Amount</th>
                                    <th className="pb-2 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentLoading ? (
                                    <tr><td colSpan={4} className="py-4 text-center text-slate-400">Loading...</td></tr>
                                ) : recentPayments.length === 0 ? (
                                    <tr><td colSpan={4} className="py-4 text-center text-slate-400">No records.</td></tr>
                                ) : (
                                    recentPayments.map((pay) => (
                                        <tr key={pay.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                                            <td className="py-2.5 font-semibold text-slate-700">{pay.policyNumber || "-"}</td>
                                            <td className="py-2.5 font-medium">{new Date(pay.dueDate).toLocaleDateString()}</td>
                                            <td className="py-2.5 text-right font-bold">${Number(pay.amount).toLocaleString()}</td>
                                            <td className="py-2.5 text-center">
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                    pay.status === "PAID" ? "bg-emerald-50 text-emerald-700" :
                                                    pay.status === "PENDING" ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"
                                                }`}>
                                                    {pay.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Customers */}
                <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/50 p-6 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider m-0">Recent Customers</h4>
                        <Link to="/admin/customers" className="text-xs font-bold text-sky-600 hover:text-sky-800">View All</Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-600">
                            <thead>
                                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                                    <th className="pb-2">Name</th>
                                    <th className="pb-2">Email</th>
                                    <th className="pb-2">Phone</th>
                                    <th className="pb-2 text-right">Location</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentLoading ? (
                                    <tr><td colSpan={4} className="py-4 text-center text-slate-400">Loading...</td></tr>
                                ) : recentCustomers.length === 0 ? (
                                    <tr><td colSpan={4} className="py-4 text-center text-slate-400">No records.</td></tr>
                                ) : (
                                    recentCustomers.map((c) => (
                                        <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                                            <td className="py-2.5 font-bold text-slate-800">{c.user?.name || "Client"}</td>
                                            <td className="py-2.5 font-medium truncate max-w-[120px]">{c.user?.email || "-"}</td>
                                            <td className="py-2.5 font-semibold text-slate-600">{c.phone}</td>
                                            <td className="py-2.5 text-right font-medium">{c.city}, {c.state}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
