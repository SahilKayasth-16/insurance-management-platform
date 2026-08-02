import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { FiShield, FiFileText, FiFolder, FiDollarSign, FiClock, FiPlus, FiCalendar, FiArrowRight } from "react-icons/fi";

import { getPaymentsApi, getPaymentApi } from "../../api/payments.api.js";
import { getClaimsApi } from "../../api/claims.api.js";
import { getDocumentsApi } from "../../api/documents.api.js";
import { useAuth } from "../../hooks/useAuth.js";

import Card from "../../components/Card.js";
import { StatCard } from "../../components/dashboard/StatCard.js";
import { ChartCard } from "../../components/dashboard/ChartCard.js";
import { AnalyticsSkeleton } from "../../components/dashboard/AnalyticsSkeleton.js";
import { LineChart, BarChart, DoughnutChart } from "../../components/dashboard/Charts.js";

export const CustomerDashboard: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);

    // Dynamic stats
    const [activePoliciesCount, setActivePoliciesCount] = useState(0);
    const [expiredPoliciesCount, setExpiredPoliciesCount] = useState(0);
    const [premiumPaidSum, setPremiumPaidSum] = useState(0);
    const [premiumDueSum, setPremiumDueSum] = useState(0);
    const [claimsCount, setClaimsCount] = useState(0);
    const [claimsApprovedCount, setClaimsApprovedCount] = useState(0);
    const [claimsPendingCount, setClaimsPendingCount] = useState(0);
    const [claimsRejectedCount, setClaimsRejectedCount] = useState(0);
    const [documentsCount, setDocumentsCount] = useState(0);

    // Lists for charts & widgets
    const [customerPolicies, setCustomerPolicies] = useState<any[]>([]);
    const [monthlyPaymentHistory, setMonthlyPaymentHistory] = useState<number[]>(new Array(12).fill(0));
    
    // Widgets states
    const [upcomingPremiumDues, setUpcomingPremiumDues] = useState<any[]>([]);
    const [latestClaims, setLatestClaims] = useState<any[]>([]);
    const [latestDocs, setLatestDocs] = useState<any[]>([]);
    const [widgetLoading, setWidgetLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // 1. Fetch payments
                const paymentsRes = await getPaymentsApi({ limit: 100 });
                let uniquePoliciesMap = new Map<string, string>();
                let paidSum = 0;
                let dueSum = 0;
                const monthlyPayments = new Array(12).fill(0);
                const pendingPayments: any[] = [];

                if (paymentsRes.success && paymentsRes.data.payments) {
                    paymentsRes.data.payments.forEach((p: any) => {
                        // Aggregate premium collected
                        if (p.status === "PAID") {
                            paidSum += Number(p.amount || 0);
                            if (p.paymentDate) {
                                const date = new Date(p.paymentDate);
                                monthlyPayments[date.getMonth()] += Number(p.amount || 0);
                            }
                        } else if (p.status === "PENDING" || p.status === "OVERDUE") {
                            dueSum += Number(p.amount || 0);
                            pendingPayments.push(p);
                        }

                        // Collect unique policies
                        if (p.policyId && !uniquePoliciesMap.has(p.policyId)) {
                            uniquePoliciesMap.set(p.policyId, p.id);
                        }
                    });

                    setPremiumPaidSum(paidSum);
                    setPremiumDueSum(dueSum);
                    setMonthlyPaymentHistory(monthlyPayments);
                    
                    // Sort pending payments by due date and take first 5
                    setUpcomingPremiumDues(
                        pendingPayments
                            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                            .slice(0, 5)
                    );

                    // Fetch details of each policy in parallel
                    const policyPromises = Array.from(uniquePoliciesMap.values()).map(async (paymentId) => {
                        try {
                            const res = await getPaymentApi(paymentId);
                            if (res.success && res.data.policy) {
                                return res.data.policy;
                            }
                        } catch (err) {
                            console.error(err);
                        }
                        return null;
                    });

                    const policies = (await Promise.all(policyPromises)).filter(Boolean);
                    setCustomerPolicies(policies);

                    const activeCount = policies.filter((p: any) => p.status === "ACTIVE").length;
                    const expiredCount = policies.filter((p: any) => p.status === "EXPIRED").length;
                    setActivePoliciesCount(activeCount);
                    setExpiredPoliciesCount(expiredCount);
                }

                // 2. Fetch claims
                const claimsRes = await getClaimsApi({ limit: 100 });
                if (claimsRes.success && claimsRes.data.claims) {
                    const claimsList = claimsRes.data.claims;
                    setClaimsCount(claimsList.length);
                    setLatestClaims(claimsList.slice(0, 5));

                    let approved = 0;
                    let pending = 0;
                    let rejected = 0;
                    claimsList.forEach((c: any) => {
                        if (c.status === "APPROVED") approved++;
                        else if (c.status === "PENDING") pending++;
                        else if (c.status === "REJECTED") rejected++;
                    });
                    setClaimsApprovedCount(approved);
                    setClaimsPendingCount(pending);
                    setClaimsRejectedCount(rejected);
                }

                // 3. Fetch documents
                const docsRes = await getDocumentsApi({ limit: 100 });
                if (docsRes.success && docsRes.data.documents) {
                    setDocumentsCount(docsRes.data.pagination.total);
                    setLatestDocs(docsRes.data.documents.slice(0, 5));
                }

            } catch (err: any) {
                toast.error(err.message || "Failed to load dashboard data.");
            } finally {
                setLoading(false);
                setWidgetLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return <AnalyticsSkeleton />;
    }

    const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // Timeline calculator
    const getPolicyProgress = (startDateStr: string, endDateStr: string) => {
        const start = new Date(startDateStr).getTime();
        const end = new Date(endDateStr).getTime();
        const now = new Date().getTime();

        if (now < start) return 0;
        if (now > end) return 100;

        const total = end - start;
        const elapsed = now - start;
        return Math.round((elapsed / total) * 100);
    };

    return (
        <div className="space-y-8 font-sans">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 m-0">
                        My Coverage Dashboard
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 font-semibold">
                        Review your policy details, track claim updates, and upload credentials securely.
                    </p>
                </div>
                <div className="flex items-center shrink-0">
                    <Link
                        to="/customer/claims"
                        className="flex items-center space-x-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-600/10 hover:bg-sky-700 transition-all"
                    >
                        <FiPlus className="h-4 w-4" />
                        <span>File Claim</span>
                    </Link>
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {/* Active policies */}
                <StatCard
                    title="Active Policies"
                    value={activePoliciesCount}
                    icon={<FiShield className="h-6 w-6 text-emerald-600" />}
                    description={`${expiredPoliciesCount} Expired Policies`}
                    colorClass="bg-emerald-50/50 border-emerald-100/60"
                />

                {/* Submitted Claims */}
                <StatCard
                    title="Submitted Claims"
                    value={claimsCount}
                    icon={<FiFileText className="h-6 w-6 text-sky-600" />}
                    description={`${claimsPendingCount} Pending Reviews`}
                    colorClass="bg-sky-50/50 border-sky-100/60"
                />

                {/* Premiums Paid */}
                <StatCard
                    title="Premium Paid"
                    value={`$${premiumPaidSum.toLocaleString()}`}
                    icon={<FiDollarSign className="h-6 w-6 text-indigo-600" />}
                    description="Total Life-to-date"
                    colorClass="bg-indigo-50/50 border-indigo-100/60"
                />

                {/* Premium Due */}
                <StatCard
                    title="Premium Due"
                    value={`$${premiumDueSum.toLocaleString()}`}
                    icon={<FiClock className="h-6 w-6 text-rose-600" />}
                    description="Current Outstanding"
                    colorClass="bg-rose-50/50 border-rose-100/60"
                />
            </div>

            {/* Charts Grid */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Premium Payment History */}
                <ChartCard title="Premium Payments History" icon={<FiDollarSign />}>
                    <BarChart
                        labels={monthLabels}
                        datasets={[
                            {
                                label: "Paid Premium ($)",
                                data: monthlyPaymentHistory,
                                backgroundColor: "#818cf8",
                                borderColor: "#4f46e5",
                                borderWidth: 1
                            }
                        ]}
                    />
                </ChartCard>

                {/* Claim Status */}
                <ChartCard title="Claims Evaluation Ratios" icon={<FiFileText />}>
                    <DoughnutChart
                        labels={["Approved", "Pending", "Rejected"]}
                        datasets={[
                            {
                                data: [claimsApprovedCount, claimsPendingCount, claimsRejectedCount],
                                backgroundColor: ["#10b981", "#f59e0b", "#f43f5e"],
                                borderColor: ["#ffffff", "#ffffff", "#ffffff"],
                                borderWidth: 2
                            }
                        ]}
                    />
                </ChartCard>
            </div>

            {/* Policy Timelines */}
            <Card className="border border-slate-200/40">
                <div className="flex items-center space-x-2 mb-4 border-b border-slate-100 pb-3">
                    <FiShield className="h-5 w-5 text-sky-600" />
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider m-0">Policy Duration Timelines</h3>
                </div>
                {customerPolicies.length === 0 ? (
                    <div className="text-xs text-slate-400 text-center py-6">No policies assigned.</div>
                ) : (
                    <div className="space-y-4">
                        {customerPolicies.map((p) => {
                            const progress = getPolicyProgress(p.startDate, p.endDate);
                            return (
                                <div key={p.id} className="p-4 rounded-xl bg-slate-50/50 border border-slate-100/70 space-y-2">
                                    <div className="flex justify-between items-center text-xs font-bold">
                                        <span className="text-slate-800">{p.policyNumber} ({p.policyType})</span>
                                        <span className="text-slate-500">
                                            {new Date(p.startDate).toLocaleDateString()} to {new Date(p.endDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="relative w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                                        <div 
                                            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-300 ${
                                                p.status === "ACTIVE" ? "bg-sky-500" : "bg-slate-400"
                                            }`}
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400">
                                        <span>Progress: {progress}% elapsed</span>
                                        <span className={`inline-block rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                                            p.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                                        }`}>{p.status}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>

            {/* Widgets Grid */}
            <div className="grid gap-6 md:grid-cols-3">
                {/* Upcoming Dues */}
                <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/50 p-6 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider m-0">Upcoming Premium Dues</h4>
                        <Link to="/customer/payments" className="text-[10px] font-bold text-sky-600 hover:text-sky-800 uppercase flex items-center space-x-0.5">
                            <span>Payments</span> <FiArrowRight />
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {widgetLoading ? (
                            <div className="text-xs text-slate-400 text-center py-4">Loading...</div>
                        ) : upcomingPremiumDues.length === 0 ? (
                            <div className="text-xs text-slate-400 text-center py-4">All premiums are settled.</div>
                        ) : (
                            upcomingPremiumDues.map((d) => (
                                <div key={d.id} className="flex justify-between items-center text-xs font-semibold p-2.5 rounded-lg bg-slate-50/50 border border-slate-100">
                                    <div>
                                        <span className="text-slate-800 font-bold block">{d.policyNumber}</span>
                                        <span className="text-[10px] text-slate-400 font-bold block">Due: {new Date(d.dueDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-slate-800 font-extrabold block">${Number(d.amount).toLocaleString()}</span>
                                        <span className="inline-block rounded-full px-1.5 py-0.5 text-[9px] font-bold mt-0.5 bg-rose-50 text-rose-700">DUE</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Recent claims */}
                <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/50 p-6 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider m-0">Recent Claim Requests</h4>
                        <Link to="/customer/claims" className="text-[10px] font-bold text-sky-600 hover:text-sky-800 uppercase flex items-center space-x-0.5">
                            <span>My Claims</span> <FiArrowRight />
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {widgetLoading ? (
                            <div className="text-xs text-slate-400 text-center py-4">Loading...</div>
                        ) : latestClaims.length === 0 ? (
                            <div className="text-xs text-slate-400 text-center py-4">No claims filed.</div>
                        ) : (
                            latestClaims.map((c) => (
                                <div key={c.id} className="flex justify-between items-center text-xs font-semibold p-2.5 rounded-lg bg-slate-50/50 border border-slate-100">
                                    <div>
                                        <span className="text-slate-800 font-bold block truncate max-w-[120px]">{c.reason}</span>
                                        <span className="text-[10px] text-slate-400 font-bold block">{new Date(c.submissionDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-slate-800 font-extrabold block">${Number(c.claimAmount).toLocaleString()}</span>
                                        <span className={`inline-block rounded-full px-1.5 py-0.5 text-[9px] font-bold mt-0.5 ${
                                            c.status === "APPROVED" ? "bg-emerald-50 text-emerald-700" :
                                            c.status === "PENDING" ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"
                                        }`}>{c.status}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Latest documents */}
                <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/50 p-6 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider m-0">Uploaded Document Files</h4>
                        <Link to="/customer/documents" className="text-[10px] font-bold text-sky-600 hover:text-sky-800 uppercase flex items-center space-x-0.5">
                            <span>Vault</span> <FiArrowRight />
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {widgetLoading ? (
                            <div className="text-xs text-slate-400 text-center py-4">Loading...</div>
                        ) : latestDocs.length === 0 ? (
                            <div className="text-xs text-slate-400 text-center py-4">No documents uploaded.</div>
                        ) : (
                            latestDocs.map((doc) => (
                                <div key={doc.id} className="flex justify-between items-center text-xs font-semibold p-2.5 rounded-lg bg-slate-50/50 border border-slate-100">
                                    <div>
                                        <span className="text-slate-800 font-bold block truncate max-w-[120px]">{doc.fileName}</span>
                                        <span className="text-[10px] text-slate-400 font-bold block">{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="inline-block rounded-full px-1.5 py-0.5 text-[9px] font-bold bg-sky-50 text-sky-700">{doc.documentType}</span>
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

export default CustomerDashboard;
