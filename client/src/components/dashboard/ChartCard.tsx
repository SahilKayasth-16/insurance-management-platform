import React from "react";
import Card from "../Card.js";

interface ChartCardProps {
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
    title,
    icon,
    children,
    className = ""
}) => {
    return (
        <Card className={`border border-slate-200/40 ${className}`}>
            <div className="flex items-center space-x-2 mb-4 border-b border-slate-100 pb-3">
                {icon && <div className="text-sky-600 shrink-0">{icon}</div>}
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider m-0">
                    {title}
                </h3>
            </div>
            <div className="relative w-full h-64">
                {children}
            </div>
        </Card>
    );
};

export default ChartCard;
