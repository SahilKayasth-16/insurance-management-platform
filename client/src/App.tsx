import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/auth.store.js";
import LoginPage from "./pages/Login/index.js";
import UnauthorizedPage from "./pages/Unauthorized/index.js";
import NotFoundPage from "./pages/NotFound/index.js";

// Layouts
import AdminLayout from "./layouts/AdminLayout.js";
import AgentLayout from "./layouts/AgentLayout.js";
import CustomerLayout from "./layouts/CustomerLayout.js";

// Dashboards
import AdminDashboard from "./pages/dashboard/AdminDashboard.js";
import AgentDashboard from "./pages/dashboard/AgentDashboard.js";
import CustomerDashboard from "./pages/dashboard/CustomerDashboard.js";

// Core Business Modules
import UsersList from "./pages/users/UsersList.js";
import CustomersList from "./pages/customers/CustomersList.js";
import PoliciesList from "./pages/policies/PoliciesList.js";
import PaymentsList from "./pages/payments/PaymentsList.js";
import ClaimsList from "./pages/claims/ClaimsList.js";
import DocumentsList from "./pages/documents/DocumentsList.js";
import ReportsPage from "./pages/reports/ReportsPage.js";

// Route guards
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
            <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-700 font-sans">
                <div className="flex flex-col items-center space-y-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-500 border-t-transparent"></div>
                    <span className="text-sm font-semibold text-slate-500">Loading Insurance Portal...</span>
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
                        <Route path="/admin/users" element={<UsersList />} />
                        <Route path="/admin/customers" element={<CustomersList />} />
                        <Route path="/admin/policies" element={<PoliciesList />} />
                        <Route path="/admin/payments" element={<PaymentsList />} />
                        <Route path="/admin/claims" element={<ClaimsList />} />
                        <Route path="/admin/documents" element={<DocumentsList />} />
                        <Route path="/admin/reports" element={<ReportsPage />} />
                    </Route>
                </Route>

                {/* Agent Routes */}
                <Route element={<AgentRoute />}>
                    <Route element={<AgentLayout />}>
                        <Route path="/agent/dashboard" element={<AgentDashboard />} />
                        <Route path="/agent/customers" element={<CustomersList />} />
                        <Route path="/agent/policies" element={<PoliciesList />} />
                        <Route path="/agent/payments" element={<PaymentsList />} />
                        <Route path="/agent/claims" element={<ClaimsList />} />
                        <Route path="/agent/documents" element={<DocumentsList />} />
                    </Route>
                </Route>

                {/* Customer Routes */}
                <Route element={<CustomerRoute />}>
                    <Route element={<CustomerLayout />}>
                        <Route path="/customer/dashboard" element={<CustomerDashboard />} />
                        <Route path="/customer/policies" element={<PoliciesList />} />
                        <Route path="/customer/payments" element={<PaymentsList />} />
                        <Route path="/customer/claims" element={<ClaimsList />} />
                        <Route path="/customer/documents" element={<DocumentsList />} />
                    </Route>
                </Route>

                {/* 404 Fallback */}
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
