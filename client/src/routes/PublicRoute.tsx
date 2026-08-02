import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

export const PublicRoute = () => {
    const { isAuthenticated, role, initialized } = useAuth();

    if (!initialized) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-white">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
            </div>
        );
    }

    if (isAuthenticated && role) {
        if (role === "ADMIN") {
            return <Navigate to="/admin/dashboard" replace />;
        }
        if (role === "AGENT") {
            return <Navigate to="/agent/dashboard" replace />;
        }
        if (role === "CUSTOMER") {
            return <Navigate to="/customer/dashboard" replace />;
        }
    }

    return <Outlet />;
};

export default PublicRoute;
