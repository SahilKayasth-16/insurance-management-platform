import { useAuth } from "../../hooks/useAuth.js";
import { FiShield, FiFileText, FiFolder, FiDollarSign } from "react-icons/fi";

export const CustomerDashboard = () => {
    const { user } = useAuth();

    const stats = [
        { label: "My Active Policies", value: "2", icon: <FiShield className="h-6 w-6 text-blue-400" /> },
        { label: "Submitted Claims", value: "1", icon: <FiFileText className="h-6 w-6 text-indigo-400" /> },
        { label: "Total Coverage Value", value: "$250,000", icon: <FiDollarSign className="h-6 w-6 text-violet-400" /> },
        { label: "Uploaded Documents", value: "4", icon: <FiFolder className="h-6 w-6 text-sky-400" /> }
    ];

    return (
        <div className="space-y-8 font-sans">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-100 m-0">
                    Welcome, {user?.name || "Valued Customer"}
                </h1>
                <p className="mt-2 text-slate-400">
                    Review your insurance policies, make payments, or file a claim request.
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

            {/* Customer Options Grid */}
            <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
                    <h3 className="text-lg font-semibold text-slate-200 mb-4">My Coverages</h3>
                    <div className="h-64 flex items-center justify-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40 text-slate-500">
                        Detailed review of active policy clauses, premium values & durations
                    </div>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
                    <h3 className="text-lg font-semibold text-slate-200 mb-4">Support & Help</h3>
                    <div className="h-64 flex items-center justify-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40 text-slate-500">
                        Raise claims, contact your assigned agent, or upload verified ID/Address Proofs
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerDashboard;
