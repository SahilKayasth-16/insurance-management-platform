import React from "react";

// SECTION HEADER
interface SectionHeaderProps {
    title: string;
    className?: string;
}
export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, className = "" }) => (
    <h3 className={`text-base font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4 mt-6 ${className}`}>
        {title}
    </h3>
);

// BASE FIELD WRAPPER FOR LABELS AND ERRORS
interface FieldWrapperProps {
    label: string;
    error?: string;
    required?: boolean;
    children: React.ReactNode;
}
const FieldWrapper: React.FC<FieldWrapperProps> = ({ label, error, required, children }) => (
    <div className="flex flex-col space-y-1.5 w-full">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {children}
        {error && <span className="text-xs font-medium text-rose-500">{error}</span>}
    </div>
);

// FORM INPUT
interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}
export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
    ({ label, error, required, className = "", ...props }, ref) => {
        return (
            <FieldWrapper label={label} error={error} required={required}>
                <input
                    ref={ref}
                    required={required}
                    className={`block w-full rounded-xl border border-slate-200/60 bg-white/70 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/10 backdrop-blur-md transition-all font-medium ${
                        error ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/10" : ""
                    } ${className}`}
                    {...props}
                />
            </FieldWrapper>
        );
    }
);
FormInput.displayName = "FormInput";

// SELECT INPUT
interface SelectOption {
    value: string | number;
    label: string;
}
interface SelectInputProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    options: SelectOption[];
    error?: string;
}
export const SelectInput = React.forwardRef<HTMLSelectElement, SelectInputProps>(
    ({ label, options, error, required, className = "", ...props }, ref) => {
        return (
            <FieldWrapper label={label} error={error} required={required}>
                <select
                    ref={ref}
                    required={required}
                    className={`block w-full rounded-xl border border-slate-200/60 bg-white/70 px-4 py-2.5 text-sm text-slate-800 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/10 backdrop-blur-md transition-all font-medium ${
                        error ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/10" : ""
                    } ${className}`}
                    {...props}
                >
                    <option value="" disabled>Select option...</option>
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </FieldWrapper>
        );
    }
);
SelectInput.displayName = "SelectInput";

// DATE PICKER
interface DatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}
export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
    ({ label, error, required, className = "", ...props }, ref) => {
        return (
            <FieldWrapper label={label} error={error} required={required}>
                <input
                    type="date"
                    ref={ref}
                    required={required}
                    className={`block w-full rounded-xl border border-slate-200/60 bg-white/70 px-4 py-2.5 text-sm text-slate-800 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/10 backdrop-blur-md transition-all font-medium ${
                        error ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/10" : ""
                    } ${className}`}
                    {...props}
                />
            </FieldWrapper>
        );
    }
);
DatePicker.displayName = "DatePicker";

// CURRENCY FIELD
interface CurrencyFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    currencySymbol?: string;
}
export const CurrencyField = React.forwardRef<HTMLInputElement, CurrencyFieldProps>(
    ({ label, error, required, currencySymbol = "$", className = "", ...props }, ref) => {
        return (
            <FieldWrapper label={label} error={error} required={required}>
                <div className="relative rounded-xl shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                        <span className="text-sm font-semibold text-slate-400">{currencySymbol}</span>
                    </div>
                    <input
                        type="number"
                        step="0.01"
                        ref={ref}
                        required={required}
                        className={`block w-full rounded-xl border border-slate-200/60 bg-white/70 pl-8 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/10 backdrop-blur-md transition-all font-medium ${
                            error ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/10" : ""
                        } ${className}`}
                        {...props}
                    />
                </div>
            </FieldWrapper>
        );
    }
);
CurrencyField.displayName = "CurrencyField";
