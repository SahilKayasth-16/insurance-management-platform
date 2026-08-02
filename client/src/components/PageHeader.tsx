import React from "react";

interface PageHeaderProps {
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, action }) => {
    return (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 m-0">
                    {title}
                </h1>
                {description && (
                    <p className="mt-1 text-sm text-slate-500 font-medium">
                        {description}
                    </p>
                )}
            </div>
            {action && <div className="flex items-center shrink-0">{action}</div>}
        </div>
    );
};

export default PageHeader;
