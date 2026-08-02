import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import { FiSlash, FiArrowLeft } from "react-icons/fi";

export const UnauthorizedPage = () => {
    const { role } = useAuth();
    const navigate = useNavigate();

    const handleGoBack = () => {
        if (role === "ADMIN") {
            navigate("/admin/dashboard", { replace: true });
        } else if (role === "AGENT") {
            navigate("/agent/dashboard", { replace: true });
        } else if (role === "CUSTOMER") {
            navigate("/customer/dashboard", { replace: true });
        } else {
            navigate("/login", { replace: true });
        }
    };

    return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-950 px-4 text-center text-slate-100 font-sans">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(239,68,68,0.1),transparent_50%)]"></div>
            
            <div className="relative space-y-6 max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-md">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 border border-red-500/30 text-red-500">
                    <FiSlash className="h-10 w-10" />
                </div>
                
                <div className="space-y-2">
                    <h1 className="text-6xl font-extrabold text-red-500 tracking-tight">403</h1>
                    <h2 className="text-xl font-semibold text-slate-200">Access Denied</h2>
                    <p className="text-sm text-slate-400">
                        You do not have the required permissions to access this resource.
                    </p>
                </div>

                <button
                    onClick={handleGoBack}
                    className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                >
                    <FiArrowLeft className="h-4 w-4" />
                    <span>Return to Dashboard</span>
                </button>
            </div>
        </div>
    );
};

export default UnauthorizedPage;
