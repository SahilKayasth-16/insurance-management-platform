import React from "react";

interface RoleBadgeProps {
    role: string;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role }) => {
    const r = role.toUpperCase();

    let style = "bg-slate-100 text-slate-600 ring-slate-500/10"; // Default Gray
    
    if (r === "ADMIN") {
        style = "bg-violet-50 text-violet-700 ring-violet-600/20";
    } else if (r === "AGENT") {
        style = "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
    } else if (r === "CUSTOMER") {
        style = "bg-blue-50 text-blue-700 ring-blue-600/20";
    }

    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${style}`}>
            {role}
        </span>
    );
};

export default RoleBadge;
