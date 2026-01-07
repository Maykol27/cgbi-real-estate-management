import React from 'react';

interface ModalProps {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
    maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({ title, onClose, children, maxWidth = "max-w-md" }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className={`bg-white dark:bg-card-dark rounded-2xl shadow-2xl w-full ${maxWidth} overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]`}>
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-primary">
                <h3 className="font-bold text-white">{title}</h3>
                <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                    <span className="material-icons-round">close</span>
                </button>
            </div>
            <div className="p-6 overflow-y-auto bg-gray-50/50 dark:bg-background-dark/50 custom-scrollbar">
                {children}
            </div>
        </div>
    </div>
);
