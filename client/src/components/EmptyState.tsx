import React from "react";
import { FiInbox } from "react-icons/fi";

interface EmptyStateProps {
    title?: string;
    description?: string;
    action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    title = "No data found",
    description = "There are no records matching your query.",
    action
}) => {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-slate-200 bg-white/50 backdrop-blur-sm max-w-lg mx-auto">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100/80 mb-4 border border-slate-200/40">
                <FiInbox className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">{title}</h3>
            <p className="text-sm text-slate-500 font-medium max-w-sm mb-6">{description}</p>
            {action && <div className="flex items-center justify-center">{action}</div>}
        </div>
    );
};

export default EmptyState;
