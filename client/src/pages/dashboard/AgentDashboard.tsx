import { useAuth } from "../../hooks/useAuth.js";
import { FiShield, FiFileText, FiDollarSign, FiClock } from "react-icons/fi";

export const AgentDashboard = () => {
    const { user } = useAuth();

    const stats = [
        { label: "Assigned Policies", value: "348", icon: <FiShield className="h-6 w-6 text-emerald-400" /> },
        { label: "Pending Policy Renewals", value: "24", icon: <FiClock className="h-6 w-6 text-yellow-400" /> },
        { label: "Active Claims Assigned", value: "15", icon: <FiFileText className="h-6 w-6 text-teal-400" /> },
        { label: "Commissions Earned", value: "$12,450", icon: <FiDollarSign className="h-6 w-6 text-indigo-400" /> }
    ];

    return (
        <div className="space-y-8 font-sans">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-100 m-0">
                    Welcome back, {user?.name || "Agent"}
                </h1>
                <p className="mt-2 text-slate-400">
                    Check your assigned policies, active claims, and monthly progress.
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
                        </div>
                    </div>
                ))}
            </div>

            {/* Tasks Section */}
            <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
                    <h3 className="text-lg font-semibold text-slate-200 mb-4">Assigned Policies Quick List</h3>
                    <div className="h-64 flex items-center justify-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40 text-slate-500">
                        View client profiles, coverage levels & active cycles
                    </div>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
                    <h3 className="text-lg font-semibold text-slate-200 mb-4">Active Claims Pipeline</h3>
                    <div className="h-64 flex items-center justify-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40 text-slate-500">
                        Verify supporting documents & update status tags
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgentDashboard;
