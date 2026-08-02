import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { FiLayout, FiShield, FiFileText, FiFolder, FiLogOut, FiMenu, FiUser, FiCreditCard } from "react-icons/fi";
import { useState } from "react";

export const CustomerLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const handleLogout = async () => {
        try {
            await logout();
            navigate("/login");
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const navItems = [
        { path: "/customer/dashboard", label: "Dashboard", icon: <FiLayout className="h-5 w-5" /> },
        { path: "/customer/policies", label: "My Policies", icon: <FiShield className="h-5 w-5" /> },
        { path: "/customer/payments", label: "Premium Payments", icon: <FiCreditCard className="h-5 w-5" /> },
        { path: "/customer/claims", label: "My Claims", icon: <FiFileText className="h-5 w-5" /> },
        { path: "/customer/documents", label: "Documents", icon: <FiFolder className="h-5 w-5" /> }
    ];

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-transparent font-sans">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-20 flex w-64 flex-col bg-white/90 border-r border-slate-200/50 backdrop-blur-md transition-transform duration-300 md:static md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex h-16 items-center px-6 border-b border-slate-100">
                    <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Customer Portal
                    </span>
                </div>
                
                <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                                    isActive 
                                    ? "bg-blue-600/10 text-blue-700 shadow-sm border-l-4 border-blue-600 pl-3" 
                                    : "text-slate-600 hover:bg-slate-100/60 hover:text-slate-900"
                                }`}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center space-x-3 rounded-xl px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                        <FiLogOut className="h-5 w-5" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Area */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Header */}
                <header className="flex h-16 items-center justify-between px-6 bg-white/70 backdrop-blur-md border-b border-slate-200/40">
                    <button 
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 md:hidden"
                    >
                        <FiMenu className="h-5 w-5" />
                    </button>
                    <div></div>
                    
                    <div className="flex items-center space-x-4">
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-600/20">
                            Customer Portal
                        </span>
                        <div className="flex items-center space-x-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 border border-slate-200/50">
                                <FiUser className="h-4 w-4 text-slate-600" />
                            </div>
                            <span className="hidden text-sm font-bold text-slate-800 md:block">
                                {user?.name || "Customer"}
                            </span>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default CustomerLayout;
