import React, { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    zIndex?: number;
    maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    zIndex = 50,
    maxWidth
}) => {
    // Debug logging
    useEffect(() => {
        if (isOpen) {
            console.log('🟢 [MODAL.TSX] MODAL SHOULD BE VISIBLE NOW', { title });
        }
    }, [isOpen, title]);

    if (!isOpen) {
        return null;
    }

    const sizeMap = {
        sm: 'max-w-md',
        md: 'max-w-xl',
        lg: 'max-w-3xl',
        xl: 'max-w-5xl'
    };

    const widthClass = maxWidth || sizeMap[size];

    // FIXED: Use Tailwind classes that respect dark mode
    return createPortal(
        <div
            className="fixed inset-0 overflow-y-auto flex items-center justify-center p-4 backdrop-blur-sm bg-black/40"
            style={{ zIndex }}
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <div
                className={`${widthClass} w-full bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 relative`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                    {title && (
                        <h3 className="text-xl font-bold text-[#D62C5E] dark:text-[#D62C5E] flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-[#D62C5E] rounded-full inline-block"></span>
                            {title}
                        </h3>
                    )}
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors ml-auto"
                    >
                        <span className="sr-only">Cerrar</span>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};
