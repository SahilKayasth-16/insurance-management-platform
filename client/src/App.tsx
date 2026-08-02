import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/auth.store.js";
import LoginPage from "./pages/Login/index.js";
import UnauthorizedPage from "./pages/Unauthorized/index.js";
import NotFoundPage from "./pages/NotFound/index.js";
import AdminLayout from "./layouts/AdminLayout.js";
import AgentLayout from "./layouts/AgentLayout.js";
import CustomerLayout from "./layouts/CustomerLayout.js";
import AdminDashboard from "./pages/Dashboard/AdminDashboard.js";
import AgentDashboard from "./pages/Dashboard/AgentDashboard.js";
import CustomerDashboard from "./pages/Dashboard/CustomerDashboard.js";
import AdminRoute from "./routes/AdminRoute.js";
import AgentRoute from "./routes/AgentRoute.js";
import CustomerRoute from "./routes/CustomerRoute.js";
import PublicRoute from "./routes/PublicRoute.js";

function App() {
    const fetchCurrentUser = useAuthStore((state) => state.fetchCurrentUser);
    const initialized = useAuthStore((state) => state.initialized);

    useEffect(() => {
        fetchCurrentUser().catch(() => {
            console.log("Session restore completed: User not authenticated.");
        });
    }, [fetchCurrentUser]);

    if (!initialized) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-100 font-sans">
                <div className="flex flex-col items-center space-y-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
                    <span className="text-sm text-slate-400">Loading Labmentix Portal...</span>
                </div>
            </div>
        );
    }

    return (
        <BrowserRouter>
            <Routes>
                {/* Public Routes */}
                <Route element={<PublicRoute />}>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/" element={<Navigate to="/login" replace />} />
                </Route>

                {/* Unauthorized page */}
                <Route path="/unauthorized" element={<UnauthorizedPage />} />

                {/* Admin Routes */}
                <Route element={<AdminRoute />}>
                    <Route element={<AdminLayout />}>
                        <Route path="/admin/dashboard" element={<AdminDashboard />} />
                        <Route path="/admin/policies" element={<div className="p-6 text-slate-300">Policies Page (Admin)</div>} />
                        <Route path="/admin/claims" element={<div className="p-6 text-slate-300">Claims Page (Admin)</div>} />
                        <Route path="/admin/customers" element={<div className="p-6 text-slate-300">Customers Page (Admin)</div>} />
                        <Route path="/admin/reports" element={<div className="p-6 text-slate-300">Reports Page (Admin)</div>} />
                    </Route>
                </Route>

                {/* Agent Routes */}
                <Route element={<AgentRoute />}>
                    <Route element={<AgentLayout />}>
                        <Route path="/agent/dashboard" element={<AgentDashboard />} />
                        <Route path="/agent/policies" element={<div className="p-6 text-slate-300">Assigned Policies (Agent)</div>} />
                        <Route path="/agent/claims" element={<div className="p-6 text-slate-300">Claims Review (Agent)</div>} />
                    </Route>
                </Route>

                {/* Customer Routes */}
                <Route element={<CustomerRoute />}>
                    <Route element={<CustomerLayout />}>
                        <Route path="/customer/dashboard" element={<CustomerDashboard />} />
                        <Route path="/customer/policies" element={<div className="p-6 text-slate-300">My Policies (Client)</div>} />
                        <Route path="/customer/claims" element={<div className="p-6 text-slate-300">My Claims (Client)</div>} />
                        <Route path="/customer/documents" element={<div className="p-6 text-slate-300">My Documents (Client)</div>} />
                    </Route>
                </Route>

                {/* 404 Fallback */}
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
