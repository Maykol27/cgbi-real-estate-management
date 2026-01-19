import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { ChangePasswordModal } from './ChangePasswordModal';

export const HeaderProfile: React.FC = () => {
    const { user, logout } = useStore();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/');
        window.location.reload();
    };

    return (
        <div className="relative">
            <div
                className="flex items-center gap-3 pl-2 cursor-pointer group select-none"
                onClick={() => setIsOpen(!isOpen)}
                title="Menú de Usuario"
            >
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold leading-tight text-slate-800 dark:text-gray-200">{user?.name || 'Usuario'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user?.role || 'Rol Desconocido'}</p>
                </div>
                <div className="size-9 rounded-full bg-primary/10 text-primary dark:text-white border-2 border-white dark:border-slate-700 shadow-sm flex items-center justify-center font-bold text-sm hover:scale-105 transition-transform">
                    {user?.name ? user.name.substring(0, 2).toUpperCase() : 'US'}
                </div>
            </div>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-transparent"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 top-12 w-48 bg-white dark:bg-card-dark rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-4 py-2 border-b border-gray-50 dark:border-gray-700 sm:hidden">
                            <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{user?.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user?.role}</p>
                        </div>

                        <button
                            onClick={() => { setIsPasswordModalOpen(true); setIsOpen(false); }}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors"
                        >
                            <span className="material-icons-round text-gray-400 text-lg">lock_reset</span>
                            Cambiar Clave
                        </button>

                        <div className="my-1 border-t border-gray-100 dark:border-gray-700"></div>

                        <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-3 transition-colors"
                        >
                            <span className="material-icons-round text-red-500 text-lg">logout</span>
                            Salir
                        </button>
                    </div>
                </>
            )}

            <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
        </div>
    );
};
