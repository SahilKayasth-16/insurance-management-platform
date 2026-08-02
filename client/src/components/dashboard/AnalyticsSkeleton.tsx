import React from "react";

export const AnalyticsSkeleton: React.FC = () => {
    return (
        <div className="space-y-8 animate-pulse w-full">
            {/* Header skeleton */}
            <div className="space-y-2">
                <div className="h-8 bg-slate-200 rounded-md w-1/4"></div>
                <div className="h-4 bg-slate-200/60 rounded-md w-1/3"></div>
            </div>

            {/* KPI grid skeleton */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="rounded-2xl border border-slate-200/50 bg-white/60 p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                            <div className="h-10 w-10 bg-slate-200 rounded-xl"></div>
                        </div>
                        <div className="space-y-2 pt-2">
                            <div className="h-7 bg-slate-200 rounded w-1/3"></div>
                            <div className="h-3 bg-slate-200/60 rounded w-1/2"></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts grid skeleton */}
            <div className="grid gap-6 md:grid-cols-2">
                {Array.from({ length: 2 }).map((_, idx) => (
                    <div key={idx} className="rounded-2xl border border-slate-200/50 bg-white/60 p-6 space-y-4">
                        <div className="h-4 bg-slate-200 rounded w-1/3 border-b border-slate-100 pb-3"></div>
                        <div className="h-60 bg-slate-200/50 rounded-xl w-full"></div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AnalyticsSkeleton;
