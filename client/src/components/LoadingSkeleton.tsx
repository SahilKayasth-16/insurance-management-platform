import React from "react";

interface LoadingSkeletonProps {
    rows?: number;
    className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ rows = 3, className = "" }) => {
    return (
        <div className={`animate-pulse space-y-4 w-full ${className}`}>
            {Array.from({ length: rows }).map((_, idx) => (
                <div key={idx} className="flex space-x-4">
                    <div className="flex-1 space-y-2 py-1">
                        <div className="h-4 bg-slate-200/80 rounded-md w-full"></div>
                        <div className="h-3 bg-slate-200/50 rounded-md w-5/6"></div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default LoadingSkeleton;
