import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 6000); // Auto close after 6s
    }, []);

    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto min-w-[300px] max-w-md p-4 rounded-xl shadow-lg border-l-4 transform transition-all animate-in slide-in-from-right-full duration-300 flex items-center justify-between gap-4 ${toast.type === 'success' ? 'bg-white dark:bg-slate-800 border-emerald-500 text-gray-800 dark:text-white' :
                            toast.type === 'error' ? 'bg-white dark:bg-slate-800 border-red-500 text-gray-800 dark:text-white' :
                                'bg-white dark:bg-slate-800 border-blue-500 text-gray-800 dark:text-white'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <span className={`material-icons-round ${toast.type === 'success' ? 'text-emerald-500' :
                                toast.type === 'error' ? 'text-red-500' :
                                    'text-blue-500'
                                }`}>
                                {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info'}
                            </span>
                            <p className="font-medium text-sm">{toast.message}</p>
                        </div>
                        <button onClick={() => removeToast(toast.id)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                            <span className="material-icons-round text-sm">close</span>
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
