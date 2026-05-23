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
            console.log('📦 [MODAL] Recibiendo datos (UserModal):', initialData, 'Type:', userType);
            if (initialData) {
                const parts = (initialData?.name || '').split(' ');
                setFormData({
                    firstName: parts[0] || '',
                    lastName: parts.slice(1).join(' ') || '',
                    email: initialData?.email || '',
                    phone: initialData?.phone || '',
                    propertyId: initialData?.propertyId || '',
                    policyNumber: initialData?.policyNumber || ''
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
    }, [isOpen, initialData, userType]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <Modal
            isOpen={isOpen}
            title={initialData ? `Editar ${userType}` : `Crear Nuevo ${userType}`}
            onClose={onClose}
            zIndex={50}
        >
            <form onSubmit={onSubmit} className="space-y-4">
                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="firstName" className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                            Nombre
                        </label>
                        <input
                            required
                            id="firstName"
                            name="firstName"
                            type="text"
                            value={formData?.firstName || ''}
                            onChange={handleChange}
                            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F9FAFB] text-sm px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#D62C5E] focus:border-transparent transition-all"
                            placeholder="Nombre"
                        />
                    </div>
                    <div>
                        <label htmlFor="lastName" className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                            Apellido
                        </label>
                        <input
                            required
                            id="lastName"
                            name="lastName"
                            type="text"
                            value={formData?.lastName || ''}
                            onChange={handleChange}
                            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F9FAFB] text-sm px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#D62C5E] focus:border-transparent transition-all"
                            placeholder="Apellido"
                        />
                    </div>
                </div>

                {/* Email */}
                <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                        Correo Electrónico
                    </label>
                    <input
                        required
                        id="email"
                        name="email"
                        type="email"
                        value={formData?.email || ''}
                        onChange={handleChange}
                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F9FAFB] text-sm px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#D62C5E] focus:border-transparent transition-all"
                        placeholder="correo@ejemplo.com"
                    />
                    <p className="mt-1.5 text-xs text-blue-600 dark:text-blue-400">
                        Al crear el usuario recuerda informarle que tiene su cuenta activa, que no olvide cambiar su contraseña
                    </p>
                </div>

                {/* Role-Specific Fields */}
                {userType === 'Propietario' && (
                    <div>
                        <label htmlFor="phone" className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                            Teléfono
                        </label>
                        <input
                            required
                            id="phone"
                            name="phone"
                            type="tel"
                            value={formData?.phone || ''}
                            onChange={handleChange}
                            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F9FAFB] text-sm px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#D62C5E] focus:border-transparent transition-all"
                            placeholder="+57 300 123 4567"
                        />
                    </div>
                )}

                {userType === 'Inquilino' && (
                    <>
                        <div>
                            <label htmlFor="propertyId" className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                                Propiedad Asignada
                            </label>
                            <select
                                id="propertyId"
                                name="propertyId"
                                value={formData?.propertyId || ''}
                                onChange={handleChange}
                                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F9FAFB] text-sm px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#D62C5E] focus:border-transparent transition-all"
                            >
                                <option value="">Seleccionar propiedad...</option>
                                {properties?.filter(p => p.listingType === 'Arriendo').map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="policyNumber" className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                                Número de solicitud asignado
                            </label>
                            <input
                                required
                                id="policyNumber"
                                name="policyNumber"
                                type="text"
                                value={formData?.policyNumber || ''}
                                onChange={handleChange}
                                placeholder="Ej: POL-123456"
                                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F9FAFB] text-sm px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#D62C5E] focus:border-transparent transition-all"
                            />
                        </div>
                    </>
                )}

                {/* CGBI Branded Submit Button - Mobile First */}
                <div className="flex flex-col-reverse md:flex-row gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-2.5 rounded-md font-bold text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="w-full bg-[#D62C5E] hover:bg-[#A01B44] text-white py-2.5 rounded-md font-bold text-sm shadow-md transition-all"
                    >
                        {initialData ? "Actualizar Usuario" : `Crear Usuario`}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
