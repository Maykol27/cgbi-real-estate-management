import React, { ReactNode } from 'react';
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
    if (!isOpen) return null;

    // Allow overriding maxWidth or map size to classes
    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-xl',
        lg: 'max-w-3xl',
        xl: 'max-w-5xl'
    };

    // Explicit maxWidth prop takes precedence, otherwise use size map
    const widthClass = maxWidth ? maxWidth : sizeClasses[size];

    return createPortal(
        <div
            className="fixed inset-0 overflow-y-auto"
            style={{ zIndex }}
            role="dialog"
            aria-modal="true"
        >
            {/* Backdrop */}
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div
                    className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-opacity-90 dark:bg-slate-900"
                    onClick={onClose}
                    aria-hidden="true"
                ></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

                <div
                    className={`inline-block w-full ${widthClass} p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-card-dark shadow-xl rounded-2xl relative`}
                    onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
                >
                    <div className="flex justify-between items-center mb-6">
                        {title && <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>}
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <span className="sr-only">Cerrar</span>
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};
