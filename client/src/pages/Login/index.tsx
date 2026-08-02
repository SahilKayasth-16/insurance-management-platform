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
            // After login, the store gets updated. We can fetch the role from the store or directly fetch
            // But since the login action finishes fetching the user, we can navigate directly
            // useAuth hook values will update, or we can fetch them from the Zustand store
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
            console.error("Login component error caught:", error);
            const errRes = error as ApiErrorResponse;
            if (errRes.errors && Array.isArray(errRes.errors)) {
                // Map field errors to react-hook-form field errors
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
        <div className="flex min-h-screen w-full items-center justify-center bg-slate-950 px-4 py-12 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
            {/* Ambient background glows */}
            <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-violet-600/15 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 bg-fuchsia-600/15 rounded-full blur-[100px] pointer-events-none"></div>
            
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.1),transparent_40%),radial-gradient(circle_at_70%_80%,rgba(217,70,239,0.1),transparent_40%)]"></div>
            
            <div className="relative w-full max-w-md space-y-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-xl">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight">
                        <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent block">
                            Welcome User !
                        </span>
                    </h2>
                    <p className="mt-2 text-center text-sm text-slate-400">
                        Enter your credentials to access your dashboard
                    </p>
                </div>

                {generalError && (
                    <div className="flex items-center space-x-2 rounded-xl bg-red-500/10 p-4 border border-red-500/20 text-sm text-red-400">
                        <FiAlertCircle className="h-5 w-5 shrink-0" />
                        <span>{generalError}</span>
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-4 rounded-md shadow-sm">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
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
                                    className={`block w-full rounded-xl border bg-slate-950/60 py-3 pl-10 pr-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all ${
                                        errors.email ? "border-red-500/50 focus:ring-red-500" : "border-slate-800 focus:border-violet-500"
                                    }`}
                                    placeholder="email@example.com"
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1 text-xs text-red-400 flex items-center space-x-1">
                                    <FiAlertCircle /> <span>{errors.email.message}</span>
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                                    <FiLock className="h-5 w-5" />
                                </span>
                                <input
                                    id="password"
                                    type="password"
                                    disabled={loading}
                                    {...register("password", {
                                        required: "Password is required"
                                    })}
                                    className={`block w-full rounded-xl border bg-slate-950/60 py-3 pl-10 pr-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all ${
                                        errors.password ? "border-red-500/50 focus:ring-red-500" : "border-slate-800 focus:border-violet-500"
                                    }`}
                                    placeholder="••••••••"
                                />
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-xs text-red-400 flex items-center space-x-1">
                                    <FiAlertCircle /> <span>{errors.password.message}</span>
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative flex w-full justify-center rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 py-3 px-4 text-sm font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
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
