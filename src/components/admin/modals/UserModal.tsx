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

    // Controlled State
    const [formData, setFormData] = React.useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        propertyId: '',
        policyNumber: ''
    });

    React.useEffect(() => {
        if (isOpen) {
            if (initialData) {
                // Split name safely
                const parts = (initialData.name || '').split(' ');
                setFormData({
                    firstName: parts[0] || '',
                    lastName: parts.slice(1).join(' ') || '',
                    email: initialData.email || '',
                    phone: initialData.phone || '', // Check if phone exists in data model
                    propertyId: initialData.propertyId || '',
                    policyNumber: initialData.policyNumber || ''
                });
            } else {
                setFormData({
                    firstName: '',
                    lastName: '',
                    email: '',
                    phone: '',
                    propertyId: '',
                    policyNumber: ''
                });
            }
        }
    }, [isOpen, initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

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
                        <label htmlFor="firstName" className="block text-xs font-bold text-gray-500 mb-1">Nombre</label>
                        <input
                            required
                            id="firstName"
                            name="firstName"
                            type="text"
                            value={formData.firstName}
                            onChange={handleChange}
                            className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="lastName" className="block text-xs font-bold text-gray-500 mb-1">Apellido</label>
                        <input
                            required
                            id="lastName"
                            name="lastName"
                            type="text"
                            value={formData.lastName}
                            onChange={handleChange}
                            className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 text-sm"
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="email" className="block text-xs font-bold text-gray-500 mb-1">Correo Electrónico</label>
                    <input
                        required
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 text-sm"
                    />
                </div>

                {userType === 'Propietario' && (
                    <div>
                        <label htmlFor="phone" className="block text-xs font-bold text-gray-500 mb-1">Teléfono</label>
                        <input
                            required
                            id="phone"
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 text-sm"
                        />
                    </div>
                )}

                {userType === 'Inquilino' && (
                    <>
                        <div>
                            <label htmlFor="propertyId" className="block text-xs font-bold text-gray-500 mb-1">Propiedad Asignada</label>
                            <select
                                id="propertyId"
                                name="propertyId"
                                value={formData.propertyId}
                                onChange={handleChange}
                                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 text-sm"
                            >
                                <option value="">Seleccionar propiedad...</option>
                                {properties.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="policyNumber" className="block text-xs font-bold text-gray-500 mb-1">Número de Póliza Asignado</label>
                            <input
                                required
                                id="policyNumber"
                                name="policyNumber"
                                type="text"
                                value={formData.policyNumber}
                                onChange={handleChange}
                                placeholder="Ej: POL-123456"
                                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 text-sm"
                            />
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
