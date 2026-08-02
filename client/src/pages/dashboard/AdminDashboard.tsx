import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { FiUsers, FiShield, FiFileText, FiTrendingUp, FiCalendar, FiActivity, FiDollarSign } from "react-icons/fi";

import Card from "../../components/Card.js";
import LoadingSkeleton from "../../components/LoadingSkeleton.js";
import { useAuth } from "../../hooks/useAuth.js";
import { getAdminDashboardApi } from "../../api/dashboard.api.js";
import type { AdminDashboardStats } from "../../api/dashboard.api.js";

export const AdminDashboard: React.FC = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<AdminDashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await getAdminDashboardApi();
                if (response.success) {
                    setStats(response.data);
                }
            } catch (err: any) {
                toast.error(err.message || "Failed to load dashboard data.");
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
            label: "Active Customers", 
            value: (stats?.customers ?? 0).toLocaleString(), 
            icon: <FiUsers className="h-6 w-6 text-sky-600" />,
            change: "Registered Profiles",
            color: "bg-sky-50/50 border-sky-100"
        },
        { 
            label: "Active Policies", 
            value: (stats?.activePolicies ?? 0).toLocaleString(), 
            icon: <FiShield className="h-6 w-6 text-emerald-600" />,
            change: `${stats?.policies || 0} Total Policies`,
            color: "bg-emerald-50/50 border-emerald-100"
        },
        { 
            label: "Pending Claims", 
            value: (stats?.claims?.pending ?? 0).toLocaleString(), 
            icon: <FiFileText className="h-6 w-6 text-amber-600" />,
            change: `${stats?.claims?.total || 0} Total Claims`,
            color: "bg-amber-50/50 border-amber-100"
        },
        { 
            label: "Premium Collected", 
            value: `$${Number(stats?.premium?.totalCollected || 0).toLocaleString()}`, 
            icon: <FiTrendingUp className="h-6 w-6 text-indigo-600" />,
            change: `$${Number(stats?.premium?.pendingAmount || 0).toLocaleString()} Pending`,
            color: "bg-indigo-50/50 border-indigo-100"
        }
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 m-0">
                    Welcome back, <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">{user?.name || "Administrator"}</span>
                </h1>
                <p className="mt-1.5 text-sm text-slate-500 font-semibold">
                    Here's what is happening with the platform today.
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

            {/* Overview Section */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border border-slate-200/40">
                    <div className="flex items-center space-x-2 mb-4">
                        <FiCalendar className="h-5 w-5 text-sky-600" />
                        <h3 className="text-base font-bold text-slate-800 uppercase tracking-wider m-0">Platform Growth (Recent Months)</h3>
                    </div>
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                        {stats?.monthlyGrowth && stats.monthlyGrowth.length > 0 ? (
                            stats.monthlyGrowth.map((monthGrowth, index) => (
                                <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 border border-slate-100 text-xs font-semibold text-slate-600">
                                    <span className="text-slate-800 font-extrabold">{monthGrowth.month}</span>
                                    <div className="flex space-x-4">
                                        <span>👥 {monthGrowth.customers} Clients</span>
                                        <span>📜 {monthGrowth.policies} Policies</span>
                                        <span className="text-emerald-600 font-extrabold">${monthGrowth.premium.toLocaleString()}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="h-48 flex items-center justify-center text-slate-400 font-medium">
                                No historical metrics found.
                            </div>
                        )}
                    </div>
                </Card>

                <Card className="border border-slate-200/40">
                    <div className="flex items-center space-x-2 mb-4">
                        <FiActivity className="h-5 w-5 text-sky-600" />
                        <h3 className="text-base font-bold text-slate-800 uppercase tracking-wider m-0">System Activity Summary</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-500">
                        <div className="p-4 rounded-xl bg-slate-50/50 border border-slate-100">
                            <span className="uppercase block tracking-wider mb-2 text-slate-400">Policy Audits</span>
                            <div className="space-y-1.5 font-semibold text-slate-600">
                                <div className="flex justify-between">
                                    <span>Active:</span>
                                    <span className="text-emerald-600 font-bold">{stats?.activePolicies}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Expired:</span>
                                    <span className="text-slate-700 font-bold">{stats?.expiredPolicies}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Cancelled:</span>
                                    <span className="text-rose-600 font-bold">{stats?.cancelledPolicies}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-50/50 border border-slate-100">
                            <span className="uppercase block tracking-wider mb-2 text-slate-400">Claims Pipeline</span>
                            <div className="space-y-1.5 font-semibold text-slate-600">
                                <div className="flex justify-between">
                                    <span>Pending:</span>
                                    <span className="text-amber-600 font-bold">{stats?.claims?.pending}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Approved:</span>
                                    <span className="text-emerald-600 font-bold">{stats?.claims?.approved}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Rejected:</span>
                                    <span className="text-rose-600 font-bold">{stats?.claims?.rejected}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default AdminDashboard;
