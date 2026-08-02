import React from "react";

interface StatusBadgeProps {
    status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    const s = status.toUpperCase();

    let style = "bg-slate-100 text-slate-600 ring-slate-500/10"; // Default Gray
    
    if (s === "ACTIVE" || s === "PAID" || s === "APPROVED") {
        style = "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
    } else if (s === "PENDING") {
        style = "bg-amber-50 text-amber-700 ring-amber-600/20";
    } else if (s === "CANCELLED" || s === "OVERDUE" || s === "FAILED" || s === "REJECTED") {
        style = "bg-rose-50 text-rose-700 ring-rose-600/20";
    } else if (s === "EXPIRED") {
        style = "bg-slate-100 text-slate-600 ring-slate-500/10";
    }

    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${style}`}>
            {status}
        </span>
    );
};

export default StatusBadge;
