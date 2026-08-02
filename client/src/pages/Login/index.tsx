import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import { useAuthStore } from "../../store/auth.store.js";
import { useState } from "react";
import type { LoginRequest } from "../../types/auth.js";
import { FiMail, FiLock, FiAlertCircle } from "react-icons/fi";

interface ApiValidationError {
    field: string;
    message: string;
}

interface ApiErrorResponse {
    message: string;
    errors?: ApiValidationError[];
}

export const LoginPage = () => {
    const { login, loading } = useAuth();
    const navigate = useNavigate();
    const [generalError, setGeneralError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors }
    } = useForm<LoginRequest>();

    const onSubmit = async (data: LoginRequest) => {
        setGeneralError(null);
        try {
            await login(data);
            const currentUser = useAuthStore.getState().user;
            
            if (currentUser) {
                if (currentUser.role === "ADMIN") {
                    navigate("/admin/dashboard", { replace: true });
                } else if (currentUser.role === "AGENT") {
                    navigate("/agent/dashboard", { replace: true });
                } else if (currentUser.role === "CUSTOMER") {
                    navigate("/customer/dashboard", { replace: true });
                }
            }
        } catch (error: any) {
            console.warn("Login validation failed:", error?.message || error);
            const errRes = error as ApiErrorResponse;
            if (errRes.errors && Array.isArray(errRes.errors)) {
                errRes.errors.forEach((err) => {
                    if (err.field === "email" || err.field === "password") {
                        setError(err.field as "email" | "password", {
                            type: "backend",
                            message: err.message
                        });
                    }
                });
            }
            setGeneralError(errRes.message || "Failed to log in. Please try again.");
        }
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center px-4 py-12 sm:px-6 lg:px-8 font-sans relative overflow-hidden bg-transparent">
            {/* Soft Ambient Overlay */}
            <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[2px]"></div>
            
            <div className="relative w-full max-w-md space-y-8 rounded-2xl border border-white/60 bg-white/80 p-8 shadow-2xl backdrop-blur-xl glass-panel-heavy">
                <div>
                    <h2 className="mt-4 text-center text-3xl font-extrabold tracking-tight">
                        <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent block">
                            Welcome User !
                        </span>
                    </h2>
                    <p className="mt-2 text-center text-sm font-semibold text-slate-500">
                        Enter your credentials to access your dashboard
                    </p>
                </div>

                {generalError && (
                    <div className="flex items-center space-x-2 rounded-xl bg-rose-50 p-4 border border-rose-100 text-sm text-rose-600 font-semibold">
                        <FiAlertCircle className="h-5 w-5 shrink-0" />
                        <span>{generalError}</span>
                    </div>
                )}

                <form className="mt-6 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-4 rounded-md">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                    <FiMail className="h-5 w-5" />
                                </span>
                                <input
                                    id="email"
                                    type="text"
                                    disabled={loading}
                                    {...register("email", {
                                        required: "Email is required",
                                        pattern: {
                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                            message: "Invalid email address"
                                        }
                                    })}
                                    className={`block w-full rounded-xl border bg-white/70 py-3 pl-10 pr-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/10 backdrop-blur-md transition-all font-semibold ${
                                        errors.email ? "border-rose-300 focus:ring-rose-500" : "border-slate-200/60 focus:border-sky-500"
                                    }`}
                                    placeholder="email@example.com"
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1 text-xs text-rose-500 flex items-center space-x-1 font-semibold">
                                    <FiAlertCircle className="shrink-0" /> <span>{errors.email.message}</span>
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                    <FiLock className="h-5 w-5" />
                                </span>
                                <input
                                    id="password"
                                    type="password"
                                    disabled={loading}
                                    {...register("password", {
                                        required: "Password is required"
                                    })}
                                    className={`block w-full rounded-xl border bg-white/70 py-3 pl-10 pr-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/10 backdrop-blur-md transition-all font-semibold ${
                                        errors.password ? "border-rose-300 focus:ring-rose-500" : "border-slate-200/60 focus:border-sky-500"
                                    }`}
                                    placeholder="••••••••"
                                />
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-xs text-rose-500 flex items-center space-x-1 font-semibold">
                                    <FiAlertCircle className="shrink-0" /> <span>{errors.password.message}</span>
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative flex w-full justify-center rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 py-3 px-4 text-sm font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"
                        >
                            {loading ? (
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                            ) : (
                                "Sign In"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
