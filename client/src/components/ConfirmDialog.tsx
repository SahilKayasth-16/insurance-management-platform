import React from "react";
import Modal from "./Modal.js";

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    onConfirm,
    onCancel,
    loading = false
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onCancel} title={title} maxWidth="max-w-md">
            <div className="mt-2">
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    {message}
                </p>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={loading}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                    {cancelText}
                </button>
                <button
                    type="button"
                    onClick={onConfirm}
                    disabled={loading}
                    className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-rose-600/10 hover:bg-rose-700 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[80px]"
                >
                    {loading ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    ) : (
                        confirmText
                    )}
                </button>
            </div>
        </Modal>
    );
};

export default ConfirmDialog;
