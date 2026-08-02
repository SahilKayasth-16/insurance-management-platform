import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { FiShield, FiFileText, FiDollarSign, FiClock, FiActivity } from "react-icons/fi";

import Card from "../../components/Card.js";
import LoadingSkeleton from "../../components/LoadingSkeleton.js";
import { useAuth } from "../../hooks/useAuth.js";
import { getAgentDashboardApi } from "../../api/dashboard.api.js";
import type { AgentDashboardStats } from "../../api/dashboard.api.js";

export const AgentDashboard: React.FC = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<AgentDashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await getAgentDashboardApi();
                if (response.success) {
                    setStats(response.data);
                }
            } catch (err: any) {
                toast.error(err.message || "Failed to load agent dashboard statistics.");
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="space-y-6">
                <LoadingSkeleton rows={4} className="mb-8" />
                <div className="grid gap-6 md:grid-cols-2">
                    <LoadingSkeleton rows={4} />
                    <LoadingSkeleton rows={4} />
                </div>
            </div>
        );
    }

    const cards = [
        { 
            label: "Assigned Policies", 
            value: (stats?.policies ?? 0).toLocaleString(), 
            icon: <FiShield className="h-6 w-6 text-emerald-600" />,
            change: `${stats?.activePolicies || 0} Active`,
            color: "bg-emerald-50/50 border-emerald-100"
        },
        { 
            label: "Pending Renewals", 
            value: (stats?.expiredPolicies ?? 0).toLocaleString(), 
            icon: <FiClock className="h-6 w-6 text-yellow-600" />,
            change: "Awaiting Action",
            color: "bg-yellow-50/50 border-yellow-100"
        },
        { 
            label: "Active Claims Assigned", 
            value: (stats?.claims?.pending ?? 0).toLocaleString(), 
            icon: <FiFileText className="h-6 w-6 text-teal-600" />,
            change: `${stats?.claims?.total || 0} Total Claims`,
            color: "bg-teal-50/50 border-teal-100"
        },
        { 
            label: "Commissions Collected", 
            value: `$${Number(stats?.premium?.totalCollected || 0).toLocaleString()}`, 
            icon: <FiDollarSign className="h-6 w-6 text-indigo-600" />,
            change: "From Paid Invoices",
            color: "bg-indigo-50/50 border-indigo-100"
        }
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 m-0">
                    Welcome back, <span className="bg-gradient-to-r from-emerald-600 to-indigo-600 bg-clip-text text-transparent">{user?.name || "Agent"}</span>
                </h1>
                <p className="mt-1.5 text-sm text-slate-500 font-semibold">
                    Check your assigned policies, active claims, and monthly progress.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {cards.map((card, idx) => (
                    <Card key={idx} className={`p-6 border hover:scale-[1.01] duration-200 transition-all ${card.color}`}>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">{card.label}</span>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-slate-100 shadow-sm shrink-0">
                                {card.icon}
                            </div>
                        </div>
                        <div className="mt-4">
                            <span className="text-3xl font-extrabold text-slate-800">{card.value}</span>
                            <div className="mt-1 flex items-center space-x-1.5">
                                <span className="text-xs font-semibold text-slate-500">
                                    {card.change}
                                </span>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Overview Pipelines */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border border-slate-200/40">
                    <div className="flex items-center space-x-2 mb-4">
                        <FiActivity className="h-5 w-5 text-sky-600" />
                        <h3 className="text-base font-bold text-slate-800 uppercase tracking-wider m-0">Performance Trend</h3>
                    </div>
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                        {stats?.monthlyGrowth && stats.monthlyGrowth.length > 0 ? (
                            stats.monthlyGrowth.map((monthGrowth, index) => (
                                <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 border border-slate-100 text-xs font-semibold text-slate-600">
                                    <span className="text-slate-800 font-extrabold">{monthGrowth.month}</span>
                                    <div className="flex space-x-4">
                                        <span>📜 {monthGrowth.policies} Policies</span>
                                        <span className="text-emerald-600 font-extrabold">${monthGrowth.premium.toLocaleString()}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="h-48 flex items-center justify-center text-slate-400 font-medium">
                                No statistics found.
                            </div>
                        )}
                    </div>
                </Card>

                <Card className="border border-slate-200/40 flex flex-col justify-center items-center text-center p-8">
                    <FiShield className="h-12 w-12 text-emerald-500 mb-4 animate-bounce" />
                    <h3 className="text-lg font-bold text-slate-800 mb-1">Dossier Access Authorization</h3>
                    <p className="text-sm text-slate-500 font-semibold max-w-sm mb-0">
                        You can manage policies, customer contact files, and claims associated with your agent code directly from the sidebar.
                    </p>
                </Card>
            </div>
        </div>
    );
};

export default AgentDashboard;
