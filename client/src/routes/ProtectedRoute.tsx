import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

export const ProtectedRoute = () => {
    const { isAuthenticated, initialized } = useAuth();

    if (!initialized) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-white">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
            </div>
        );
    }

    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
