import React from "react";
import { FiChevronUp, FiChevronDown } from "react-icons/fi";
import LoadingSkeleton from "./LoadingSkeleton.js";

export interface Column<T> {
    key: string;
    label: string;
    sortable?: boolean;
    align?: "left" | "center" | "right";
    render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    loading?: boolean;
    sortField?: string;
    sortOrder?: "asc" | "desc";
    onSort?: (field: string) => void;
}

export function DataTable<T extends { id: string | number }>({
    columns,
    data,
    loading = false,
    sortField,
    sortOrder,
    onSort
}: DataTableProps<T>) {
    const handleSort = (key: string, sortable?: boolean) => {
        if (sortable && onSort) {
            onSort(key);
        }
    };

    if (loading) {
        return (
            <div className="w-full overflow-hidden rounded-xl border border-slate-200/60 bg-white/60 backdrop-blur-md">
                <div className="p-6">
                    <LoadingSkeleton rows={5} />
                </div>
            </div>
        );
    }

    return (
        <div className="w-full overflow-hidden rounded-xl border border-slate-200/60 bg-white/70 backdrop-blur-md shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm text-slate-600">
                    <thead className="bg-slate-50/80 border-b border-slate-200/60 text-xs font-semibold uppercase tracking-wider text-slate-700">
                        <tr>
                            {columns.map((column) => {
                                const isSorted = sortField === column.key;
                                const alignClass = 
                                    column.align === "center" ? "text-center" : 
                                    column.align === "right" ? "text-right" : "text-left";
                                return (
                                    <th
                                        key={column.key}
                                        onClick={() => handleSort(column.key, column.sortable)}
                                        className={`px-6 py-4 font-semibold select-none ${alignClass} ${
                                            column.sortable ? "cursor-pointer hover:bg-slate-100/50 transition-colors" : ""
                                        }`}
                                    >
                                        <div className={`flex items-center space-x-1 ${
                                            column.align === "center" ? "justify-center" :
                                            column.align === "right" ? "justify-end" : "justify-start"
                                        }`}>
                                            <span>{column.label}</span>
                                            {column.sortable && isSorted && (
                                                sortOrder === "asc" ? <FiChevronUp className="h-4 w-4 text-slate-800" /> : <FiChevronDown className="h-4 w-4 text-slate-800" />
                                            )}
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/60 bg-transparent">
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-400 font-medium">
                                    No records found.
                                </td>
                            </tr>
                        ) : (
                            data.map((item, index) => (
                                <tr 
                                    key={item.id || index}
                                    className="hover:bg-slate-50/40 transition-colors"
                                >
                                    {columns.map((column) => {
                                        const alignClass = 
                                            column.align === "center" ? "text-center" : 
                                            column.align === "right" ? "text-right" : "text-left";
                                        return (
                                            <td key={column.key} className={`px-6 py-4 whitespace-nowrap align-middle font-medium text-slate-600 ${alignClass}`}>
                                                {column.render ? column.render(item) : (item as any)[column.key]}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default DataTable;
