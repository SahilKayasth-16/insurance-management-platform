import React, { useState, useEffect } from "react";
import { FiSearch, FiX } from "react-icons/fi";

interface SearchBarProps {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, placeholder = "Search..." }) => {
    const [localValue, setLocalValue] = useState(value);

    // Sync with external value changes
    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    // Debounce effect
    useEffect(() => {
        const handler = setTimeout(() => {
            onChange(localValue);
        }, 350);

        return () => {
            clearTimeout(handler);
        };
    }, [localValue, onChange]);

    return (
        <div className="relative w-full max-w-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <FiSearch className="h-5 w-5 text-slate-400" />
            </div>
            <input
                type="text"
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                placeholder={placeholder}
                className="block w-full rounded-xl border border-slate-200/60 bg-white/70 pl-10 pr-10 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/10 backdrop-blur-md transition-all font-medium"
            />
            {localValue && (
                <button
                    onClick={() => setLocalValue("")}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <FiX className="h-4 w-4" />
                </button>
            )}
        </div>
    );
};

export default SearchBar;
