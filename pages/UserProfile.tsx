import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { ThemeToggle, NotificationButton } from '../components/Layout';
import { HeaderProfile } from '../components/HeaderProfile';

const ProfileHeader: React.FC<{ title: string }> = ({ title }) => (
    <header className="h-16 shrink-0 bg-card-light dark:bg-card-dark border-b border-gray-100 dark:border-gray-700 flex items-center justify-between px-6 z-10 shadow-sm relative">
        <h1 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h1>
        <div className="flex items-center gap-2">
            <NotificationButton />
            <ThemeToggle />
            <HeaderProfile />
        </div>
    </header>
);

export const UserProfile: React.FC = () => {
    const { user, updateProfile, uploadAvatar } = useStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { showToast } = useToast();

    // Local state for inputs
    const [formData, setFormData] = useState({
        name: user?.name || '',
        phone: user?.phone || ''
    });
    const [loading, setLoading] = useState(false);

    // Sync state with user data
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                phone: user.phone || ''
            });
        }
    }, [user]);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && user) {
            const file = e.target.files[0];
            showToast("Subiendo foto de perfil...", "info");

            const result = await uploadAvatar(String(user.id), file);

            if (result.success) {
                showToast("Foto de perfil actualizada exitosamente.", "success");
            } else {
                showToast("Error al subir la foto: " + result.message, "error");
            }
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setLoading(true);
        try {
            await updateProfile(user.id, {
                name: formData.name,
                phone: formData.phone
            });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-900 overflow-hidden">
            <ProfileHeader title="Mi Perfil" />
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <div className="max-w-2xl mx-auto bg-card-light dark:bg-card-dark rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700 p-8">
                    <div className="flex flex-col items-center mb-8">
                        <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                            <img
                                src={user?.photoUrl || `https://i.pravatar.cc/150?u=${user?.role || 'user'}`}
                                className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-700 shadow-md object-cover"
                                alt="Avatar"
                            />
                            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="material-icons-round text-white">camera_alt</span>
                            </div>
                            <button className="absolute bottom-0 right-0 bg-primary text-white p-1.5 rounded-full shadow-sm hover:bg-primary-dark transition-colors z-10">
                                <span className="material-icons-round text-sm">edit</span>
                            </button>
                            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*" />
                        </div>
                        <h2 className="mt-4 text-xl font-bold dark:text-white">{user?.name || "Cargando..."}</h2>
                        <p className="text-gray-500">
                            {user?.role === 'Inquilino' ? 'Arrendatario' : user?.role}
                            {user?.role === 'Inquilino' && user.policyNumber && ` • Póliza: ${user.policyNumber}`}
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Completo</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-sm focus:ring-primary dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Teléfono</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-sm focus:ring-primary dark:text-white"
                                    placeholder="+57 ..."
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Correo Electrónico</label>
                            <input type="email" defaultValue={user?.email} className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-500" disabled />
                        </div>

                        <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
                            <h3 className="font-bold text-sm mb-4 dark:text-white">Seguridad</h3>
                            <button onClick={() => showToast("Enviando correo de recuperación...", "info")} className="text-primary text-sm font-medium hover:underline">Cambiar Contraseña</button>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className={`bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2 ${loading ? 'opacity-70 cursor-wait' : ''}`}
                            >
                                {loading ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
