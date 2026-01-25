import React from 'react';
import { Modal } from '../../ui/Modal';
import { useStore } from '../../../../context/StoreContext';

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    userType: 'Inquilino' | 'Propietario' | 'Admin';
    initialData?: any;
}

export const UserModal: React.FC<UserModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    userType,
    initialData
}) => {
    const { properties } = useStore();

    if (!isOpen) return null;

    return (
        <Modal
            title={initialData ? `Editar ${userType}` : `Registrar ${userType}`}
            onClose={onClose}
            zIndex={50}
        >
            <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Nombre</label>
                        {/* Assuming onSubmit handler will join Name + Surname or take name field directly.
                            Original code for Owner used split logic manually or form elements [0] + [1].
                            Here we will stick to named inputs for robustness. */}
                        <input required name="firstName" defaultValue={initialData?.name?.split(' ')[0]} type="text" className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Apellido</label>
                        <input required name="lastName" defaultValue={initialData?.name?.split(' ').slice(1).join(' ')} type="text" className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 text-sm" />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Correo Electrónico</label>
                    <input required name="email" defaultValue={initialData?.email} type="email" className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 text-sm" />
                </div>

                {userType === 'Propietario' && (
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Teléfono</label>
                        <input required name="phone" type="tel" className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 text-sm" />
                    </div>
                )}

                {userType === 'Inquilino' && (
                    <>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Propiedad Asignada</label>
                            <select name="propertyId" className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 text-sm">
                                <option value="">Seleccionar propiedad...</option>
                                {properties.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Número de Póliza Asignado</label>
                            <input required name="policyNumber" type="text" placeholder="Ej: POL-123456" className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 text-sm" />
                        </div>
                    </>
                )}

                <button type="submit" className="w-full bg-primary text-white py-2.5 rounded-lg font-bold text-sm mt-2 shadow-lg hover:bg-primary-dark">
                    {initialData ? "Actualizar Usuario" : `Registrar ${userType}`}
                </button>
            </form>
        </Modal>
    );
};
