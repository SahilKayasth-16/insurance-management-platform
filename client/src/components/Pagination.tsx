import React from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import type { PaginationInfo } from "../types/business.js";

interface PaginationProps {
    pagination: PaginationInfo;
    onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ pagination, onPageChange }) => {
    const { page, totalPages, total, limit } = pagination;

    if (totalPages <= 1) return null;

    const renderPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, page - 2);
        const end = Math.min(totalPages, start + maxVisible - 1);

        if (end - start < maxVisible - 1) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(
                <button
                    key={i}
                    onClick={() => onPageChange(i)}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold transition-all duration-200 ${
                        page === i
                            ? "bg-sky-600 text-white shadow-md shadow-sky-600/20"
                            : "bg-white/60 text-slate-600 border border-slate-200/40 hover:bg-slate-50"
                    }`}
                >
                    {i}
                </button>
            );
        }
        return pages;
    };

    const startItem = (page - 1) * limit + 1;
    const endItem = Math.min(page * limit, total);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Showing {startItem} to {endItem} of {total} records
            </span>
            <div className="flex items-center space-x-2">
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={page === 1}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/40 bg-white/60 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                    <FiChevronLeft className="h-5 w-5" />
                </button>
                {renderPageNumbers()}
                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={page === totalPages}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/40 bg-white/60 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                    <FiChevronRight className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
};

export default Pagination;
