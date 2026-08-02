import React from "react";
import Card from "../Card.js";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    description?: string;
    trend?: {
        value: string;
        isPositive: boolean;
    };
    colorClass?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    icon,
    description,
    trend,
    colorClass = "bg-sky-50/50 border-sky-100"
}) => {
    return (
        <Card className={`border hover:scale-[1.01] duration-200 transition-all ${colorClass}`}>
            <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                    {title}
                </span>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-slate-100 shadow-sm shrink-0">
                    {icon}
                </div>
            </div>
            <div className="mt-4">
                <span className="text-3xl font-extrabold text-slate-800">{value}</span>
                {(trend || description) && (
                    <div className="mt-1.5 flex items-center space-x-1.5 text-xs font-semibold text-slate-500">
                        {trend && (
                            <span className={trend.isPositive ? "text-emerald-600" : "text-rose-600"}>
                                {trend.value}
                            </span>
                        )}
                        {description && <span>{description}</span>}
                    </div>
                )}
            </div>
        </Card>
    );
};

export default StatCard;
