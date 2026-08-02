import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    heavy?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, heavy = false, className = "", ...props }) => {
    const baseClass = heavy ? "glass-panel-heavy" : "glass-panel";
    return (
        <div 
            className={`rounded-2xl p-6 transition-all duration-300 ${baseClass} ${className}`} 
            {...props}
        >
            {children}
        </div>
    );
};

export default Card;
