import React from "react";
import { FiAlertTriangle } from "react-icons/fi";

interface ErrorStateProps {
    title?: string;
    message?: string;
    onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
    title = "Request Failed",
    message = "An error occurred while fetching data. Please try again.",
    onRetry
}) => {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-rose-100 bg-rose-50/30 backdrop-blur-sm max-w-lg mx-auto">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-100/80 mb-4 border border-rose-200/40">
                <FiAlertTriangle className="h-8 w-8 text-rose-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">{title}</h3>
            <p className="text-sm text-slate-500 font-medium max-w-sm mb-6">{message}</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-slate-800 transition-all duration-200"
                >
                    Retry Request
                </button>
            )}
        </div>
    );
};

export default ErrorState;
