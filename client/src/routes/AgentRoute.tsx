import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

export const AgentRoute = () => {
    const { isAuthenticated, role, initialized } = useAuth();

    if (!initialized) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-white">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return role === "AGENT" ? <Outlet /> : <Navigate to="/unauthorized" replace />;
};

export default AgentRoute;
