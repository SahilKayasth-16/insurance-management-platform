import React, { useEffect } from "react";
import { FiX } from "react-icons/fi";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    maxWidth = "max-w-lg"
}) => {
    // Prevent scrolling behind the modal
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    // Close on Escape key press
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300"
                onClick={onClose}
            ></div>

            {/* Modal Box */}
            <div 
                className={`relative w-full ${maxWidth} transform rounded-2xl bg-white/95 backdrop-blur-lg border border-white/60 p-6 shadow-2xl transition-all duration-300 ease-out z-10 glass-panel-heavy`}
            >
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                    <h2 className="text-xl font-bold text-slate-800 m-0">
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all duration-200"
                    >
                        <FiX className="h-5 w-5" />
                    </button>
                </div>
                <div className="overflow-y-auto max-h-[70vh] pr-1">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
