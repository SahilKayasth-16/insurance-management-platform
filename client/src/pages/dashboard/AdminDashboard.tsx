import { useAuth } from "../../hooks/useAuth.js";
import { FiUsers, FiShield, FiFileText, FiTrendingUp } from "react-icons/fi";

export const AdminDashboard = () => {
    const { user } = useAuth();

    const stats = [
        { label: "Active Customers", value: "1,248", icon: <FiUsers className="h-6 w-6 text-violet-400" />, change: "+12.5% this month", trend: "up" },
        { label: "Total Policies", value: "4,821", icon: <FiShield className="h-6 w-6 text-fuchsia-400" />, change: "+8.2% this month", trend: "up" },
        { label: "Pending Claims", value: "84", icon: <FiFileText className="h-6 w-6 text-indigo-400" />, change: "-3.1% this week", trend: "down" },
        { label: "Monthly Premium Collected", value: "$342,900", icon: <FiTrendingUp className="h-6 w-6 text-emerald-400" />, change: "+15.3% this month", trend: "up" }
    ];

    return (
        <div className="space-y-8 font-sans">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-100 m-0">
                    Welcome back, {user?.name || "Administrator"}
                </h1>
                <p className="mt-2 text-slate-400">
                    Here's what is happening with the platform today.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, idx) => (
                    <div 
                        key={idx} 
                        className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-md transition-transform hover:scale-[1.02]"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-400">{stat.label}</span>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 border border-slate-700">
                                {stat.icon}
                            </div>
                        </div>
                        <div className="mt-4">
                            <span className="text-3xl font-bold text-slate-100">{stat.value}</span>
                            <div className="mt-2 flex items-center space-x-2">
                                <span className={`text-xs font-semibold ${stat.trend === "up" ? "text-emerald-400" : "text-rose-400"}`}>
                                    {stat.change}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Overview Section */}
            <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
                    <h3 className="text-lg font-semibold text-slate-200 mb-4">Platform Growth</h3>
                    <div className="h-64 flex items-center justify-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40 text-slate-500">
                        Visualizing historical trends & customer subscriptions
                    </div>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
                    <h3 className="text-lg font-semibold text-slate-200 mb-4">Recent Activity</h3>
                    <div className="h-64 flex items-center justify-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40 text-slate-500">
                        Real-time audit log of claim approvals, renewals & cancellations
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
