import React from "react";
import { Link } from "react-router-dom";
import Card from "../Card.js";

export interface QuickActionItem {
    label: string;
    path: string;
    icon: React.ReactNode;
    colorClass?: string;
    description?: string;
}

interface QuickActionCardProps {
    title?: string;
    actions: QuickActionItem[];
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({
    title = "Quick Actions",
    actions
}) => {
    return (
        <Card className="border border-slate-200/40">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-3">
                {title}
            </h3>
            <div className="grid grid-cols-2 gap-3">
                {actions.map((action, idx) => (
                    <Link
                        key={idx}
                        to={action.path}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200/30 text-center hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer ${action.colorClass || "bg-sky-50/40 hover:bg-sky-50 text-sky-700"}`}
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm shrink-0 mb-2 border border-slate-100">
                            {action.icon}
                        </div>
                        <span className="text-xs font-bold block">{action.label}</span>
                        {action.description && (
                            <span className="text-[10px] font-semibold text-slate-400 mt-1 block">
                                {action.description}
                            </span>
                        )}
                    </Link>
                ))}
            </div>
        </Card>
    );
};

export default QuickActionCard;
