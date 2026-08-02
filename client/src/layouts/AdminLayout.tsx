import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { FiLayout, FiShield, FiFileText, FiUsers, FiPieChart, FiLogOut, FiMenu, FiUser } from "react-icons/fi";
import { useState } from "react";

export const AdminLayout = () => {
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
        { path: "/admin/dashboard", label: "Dashboard", icon: <FiLayout className="h-5 w-5" /> },
        { path: "/admin/policies", label: "Policies", icon: <FiShield className="h-5 w-5" /> },
        { path: "/admin/claims", label: "Claims", icon: <FiFileText className="h-5 w-5" /> },
        { path: "/admin/customers", label: "Customers", icon: <FiUsers className="h-5 w-5" /> },
        { path: "/admin/reports", label: "Reports", icon: <FiPieChart className="h-5 w-5" /> }
    ];

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-20 flex w-64 flex-col bg-slate-900 border-r border-slate-800 transition-transform duration-300 md:static md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex h-16 items-center px-6 border-b border-slate-800">
                    <span className="text-xl font-bold bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
                        Labmentix Portal
                    </span>
                </div>
                
                <nav className="flex-1 space-y-1 px-4 py-6">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                                    isActive 
                                    ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-900/30" 
                                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                                }`}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center space-x-3 rounded-xl px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                        <FiLogOut className="h-5 w-5" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Area */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Header */}
                <header className="flex h-16 items-center justify-between px-6 bg-slate-900/50 backdrop-blur-md border-b border-slate-800/80">
                    <button 
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-100 md:hidden"
                    >
                        <FiMenu className="h-5 w-5" />
                    </button>
                    <div></div>
                    
                    <div className="flex items-center space-x-4">
                        <span className="inline-flex items-center rounded-full bg-violet-500/10 px-2.5 py-0.5 text-xs font-medium text-violet-400 ring-1 ring-inset ring-violet-500/20">
                            Admin Portal
                        </span>
                        <div className="flex items-center space-x-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 border border-slate-700">
                                <FiUser className="h-4 w-4 text-slate-300" />
                            </div>
                            <span className="hidden text-sm font-semibold text-slate-200 md:block">
                                {user?.name || "Admin"}
                            </span>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto p-6 bg-slate-950">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
