import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { FiUser, FiMail, FiLock, FiAlertCircle } from "react-icons/fi";
import { registerApi } from "../../api/auth.api.js";

interface ApiValidationError {
    field: string;
    message: string;
}

interface ApiErrorResponse {
    message: string;
    errors?: ApiValidationError[];
}

export const RegisterPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [generalError, setGeneralError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        setError,
        reset,
        formState: { errors }
    } = useForm({
        defaultValues: {
            name: "",
            email: "",
            password: ""
        }
    });

    const onSubmit = async (data: any) => {
        setGeneralError(null);
        setLoading(true);
        try {
            const response = await registerApi(data);
            if (response.success) {
                toast.success("Account registered successfully! Please log in.");
                reset();
                navigate("/login");
            }
        } catch (error: any) {
            console.warn("Registration validation failed:", error);
            const errRes = error as ApiErrorResponse;
            if (errRes.errors && Array.isArray(errRes.errors)) {
                errRes.errors.forEach((err) => {
                    if (err.field === "name" || err.field === "email" || err.field === "password") {
                        setError(err.field as "name" | "email" | "password", {
                            type: "backend",
                            message: err.message
                        });
                    }
                });
            }
            setGeneralError(errRes.message || "Failed to register account. Please try again.");
        } finally {
            setLoading(false);
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
                            Create Account
                        </span>
                    </h2>
                    <p className="mt-2 text-center text-sm font-semibold text-slate-500">
                        Join our modern daylight insurance platform
                    </p>
                </div>

                {generalError && (
                    <div className="flex items-center space-x-2 rounded-xl bg-rose-50 p-4 border border-rose-100 text-sm text-rose-600 font-semibold">
                        <FiAlertCircle className="h-5 w-5 shrink-0" />
                        <span>{generalError}</span>
                    </div>
                )}

                <form className="mt-6 space-y-5" onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-4 rounded-md">
                        {/* Name */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                Full Name
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                    <FiUser className="h-5 w-5" />
                                </span>
                                <input
                                    id="name"
                                    type="text"
                                    disabled={loading}
                                    {...register("name", {
                                        required: "Name is required",
                                        minLength: { value: 3, message: "Name must be at least 3 characters" }
                                    })}
                                    className={`block w-full rounded-xl border bg-white/70 py-3 pl-10 pr-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/10 backdrop-blur-md transition-all font-semibold ${
                                        errors.name ? "border-rose-300 focus:ring-rose-500" : "border-slate-200/60 focus:border-sky-500"
                                    }`}
                                    placeholder="Enter your name"
                                />
                            </div>
                            {errors.name && (
                                <p className="mt-1 text-xs text-rose-500 flex items-center space-x-1 font-semibold">
                                    <FiAlertCircle className="shrink-0" /> <span>{errors.name.message}</span>
                                </p>
                            )}
                        </div>

                        {/* Email */}
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

                        {/* Password */}
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
                                        required: "Password is required",
                                        minLength: { value: 8, message: "Password must be at least 8 characters" },
                                        validate: {
                                            uppercase: (v) => /[A-Z]/.test(v) || "One uppercase letter required",
                                            lowercase: (v) => /[a-z]/.test(v) || "One lowercase letter required",
                                            number: (v) => /[0-9]/.test(v) || "One number required",
                                            special: (v) => /[^A-Za-z0-9]/.test(v) || "One special character required"
                                        }
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
                                "Sign Up"
                            )}
                        </button>
                    </div>

                    <div className="text-center mt-4">
                        <span className="text-xs font-semibold text-slate-500">
                            Already registered?{" "}
                            <Link to="/login" className="font-bold text-sky-600 hover:text-sky-800 transition-colors">
                                Login here
                            </Link>
                        </span>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegisterPage;
