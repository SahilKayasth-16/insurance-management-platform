import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { FiPieChart, FiTrendingUp, FiDollarSign, FiPercent } from "react-icons/fi";

import PageHeader from "../../components/PageHeader.js";
import Card from "../../components/Card.js";
import DataTable, { Column } from "../../components/DataTable.js";
import LoadingSkeleton from "../../components/LoadingSkeleton.js";

import { getMonthlyReportApi } from "../../api/dashboard.api.js";
import type { MonthlyReportData, MonthlyReportMetric } from "../../api/dashboard.api.js";

export const ReportsPage: React.FC = () => {
    const [year, setYear] = useState(new Date().getFullYear());
    const [report, setReport] = useState<MonthlyReportData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReport = async () => {
            setLoading(true);
            try {
                const response = await getMonthlyReportApi(year);
                if (response.success) {
                    setReport(response.data);
                }
            } catch (err: any) {
                toast.error(err.message || "Failed to load monthly reports.");
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, [year]);

    if (loading) {
        return (
            <div className="space-y-6">
                <LoadingSkeleton rows={4} className="mb-8" />
                <LoadingSkeleton rows={5} />
            </div>
        );
    }

    const columns: Column<MonthlyReportMetric & { id: string }>[] = [
        { key: "month", label: "Month" },
        { 
            key: "newCustomersCount", 
            label: "New Clients", 
            align: "center",
            render: (item) => item.newCustomersCount.toLocaleString()
        },
        { 
            key: "newPoliciesCount", 
            label: "Policies Issued", 
            align: "center",
            render: (item) => item.newPoliciesCount.toLocaleString()
        },
        { 
            key: "premiumCollected", 
            label: "Premiums Paid", 
            align: "right",
            render: (item) => `$${Number(item.premiumCollected).toLocaleString()}`
        },
        { 
            key: "claimsSubmitted", 
            label: "Claims Filed", 
            align: "center",
            render: (item) => item.claimsSubmitted.toLocaleString()
        },
        { 
            key: "claimsApproved", 
            label: "Claims Approved", 
            align: "center",
            render: (item) => item.claimsApproved.toLocaleString()
        },
        { 
            key: "claimsPaidAmount", 
            label: "Paid Claims Value", 
            align: "right",
            render: (item) => `$${Number(item.claimsPaidAmount).toLocaleString()}`
        }
    ];

    const stats = [
        { 
            label: "Total Premium Revenue", 
            value: `$${Number(report?.totals?.totalPremiumCollected || 0).toLocaleString()}`, 
            icon: <FiDollarSign className="h-6 w-6 text-emerald-600" />,
            color: "bg-emerald-50/50 border-emerald-100"
        },
        { 
            label: "New Policyholders", 
            value: report?.totals?.totalNewCustomers?.toLocaleString() || "0", 
            icon: <FiTrendingUp className="h-6 w-6 text-sky-600" />,
            color: "bg-sky-50/50 border-sky-100"
        },
        { 
            label: "Claims Payout Value", 
            value: `$${Number(report?.totals?.totalClaimsPaidAmount || 0).toLocaleString()}`, 
            icon: <FiPieChart className="h-6 w-6 text-rose-600" />,
            color: "bg-rose-50/50 border-rose-100"
        }
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Business Metrics & Reports"
                description="View annual summaries, policyholder growth, premium collections, and claims history."
                action={
                    <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="rounded-xl border border-slate-200/60 bg-white/70 px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/10 backdrop-blur-md"
                    >
                        <option value={2026}>Year 2026</option>
                        <option value={2025}>Year 2025</option>
                    </select>
                }
            />

            {/* Totals Summary */}
            <div className="grid gap-6 sm:grid-cols-3">
                {stats.map((stat, idx) => (
                    <Card key={idx} className={`p-6 border ${stat.color}`}>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-slate-100 shadow-sm shrink-0">
                                {stat.icon}
                            </div>
                        </div>
                        <div className="mt-4">
                            <span className="text-2xl font-extrabold text-slate-800">{stat.value}</span>
                        </div>
                    </Card>
                ))}
            </div>

            <Card>
                <div className="flex items-center space-x-2 mb-6">
                    <FiPieChart className="h-5 w-5 text-sky-600" />
                    <h3 className="text-base font-bold text-slate-800 uppercase tracking-wider m-0">Monthly Breakdown: {year}</h3>
                </div>
                <DataTable
                    columns={columns}
                    data={(report?.metrics || []).map(m => ({ ...m, id: m.month }))}
                />
            </Card>
        </div>
    );
};

export default ReportsPage;
