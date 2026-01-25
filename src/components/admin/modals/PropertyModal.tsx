import React from 'react';
import { Modal } from '../../ui/Modal';
import { useStore } from '../../../../context/StoreContext';

interface PropertyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    initialData?: any;
    setPropertyImage: (file: File | null) => void;
    setFormListingType: (type: 'Venta' | 'Arriendo') => void;
    formListingType: 'Venta' | 'Arriendo';
}

export const PropertyModal: React.FC<PropertyModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    setPropertyImage,
    setFormListingType,
    formListingType
}) => {
    const { users } = useStore();

    // Local State for Controlled Inputs
    const [formData, setFormData] = React.useState({
        name: '',
        address: '',
        type: 'Apartamento',
        rent: '',
        owner: '',
        owner_id: '',
        sqMeters: '',
        parking: '',
        rooms: '',
        bathrooms: '',
        description: '',
        status: 'Disponible'
    });

    // 🔍 LOG: Traceability - Open/Props & Sync State
    React.useEffect(() => {
        if (isOpen) {
            console.log('📦 [MODAL] Recibiendo datos (PropertyModal):', initialData);
            if (initialData) {
                setFormData({
                    name: initialData.name || '',
                    address: initialData.address || '',
                    type: initialData.type || 'Apartamento',
                    rent: initialData.rent || '',
                    owner: initialData.owner || '',
                    owner_id: initialData.owner_id || '',
                    sqMeters: initialData.sqMeters || '',
                    parking: initialData.parking || '',
                    rooms: initialData.rooms || '',
                    bathrooms: initialData.bathrooms || '',
                    description: initialData.description || '',
                    status: initialData.status || 'Disponible'
                });
            } else {
                // Reset for creation
                setFormData({
                    name: '',
                    address: '',
                    type: 'Apartamento',
                    rent: '',
                    owner: '',
                    owner_id: '',
                    sqMeters: '',
                    parking: '',
                    rooms: '',
                    bathrooms: '',
                    description: '',
                    status: 'Disponible'
                });
            }
        }
    }, [isOpen, initialData]);

    // Handle generic change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        // console.log('✍️ [FORM] Campo modificado:', name, value);
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // 🛡️ Guard Clause: Prevent empty render on Edit Mode
    if (isOpen && initialData === undefined && typeof initialData !== 'object' && initialData !== null) {
        // Logic preserved
    }

    if (!isOpen) return null;

    // 🛡️ Debug: If we think we are editing but data is empty
    if (initialData && Object.keys(initialData).length === 0) {
        console.warn('⚠️ Modal abierto en modo edición pero sin datos válidos.');
        return <div className="p-10 text-center">Cargando datos del servidor...</div>;
    }

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('🚀 [CRUD] Enviando a BD (wrapper)...', formData);
        onSubmit(e);
    };

    return (
        <Modal
            title={initialData ? "Editar Propiedad y Estatus" : "Registrar Nueva Propiedad"}
            onClose={onClose}
            zIndex={50}
        >
            <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-xs font-bold text-gray-500 mb-1">Nombre / Identificador</label>
                    <input
                        required
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        type="text"
                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 text-sm"
                        placeholder="Ej: Apto 301 - Edif. Solar"
                    />
                </div>
                <div>
                    <label htmlFor="address" className="block text-xs font-bold text-gray-500 mb-1">Dirección</label>
                    <input
                        required
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        type="text"
                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 text-sm"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="listingType" className="block text-xs font-bold text-gray-500 mb-1">Tipo de Operación</label>
                        <select
                            id="listingType"
                            name="listingType"
                            value={formListingType}
                            onChange={(e) => {
                                console.log('✍️ [FORM] Cambio listingType:', e.target.value);
                                setFormListingType(e.target.value as 'Venta' | 'Arriendo');
                            }}
                            className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 text-sm"
                        >
                            <option value="Arriendo">Arriendo</option>
                            <option value="Venta">Venta</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="type" className="block text-xs font-bold text-gray-500 mb-1">Tipo Inmueble</label>
                        <select
                            id="type"
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 text-sm"
                        >
                            <option>Apartamento</option>
                            <option>Casa</option>
                            <option>Local</option>
                            <option>Oficina</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="rent" className="block text-xs font-bold text-gray-500 mb-1">{formListingType === 'Venta' ? 'Precio Venta (COP)' : 'Canon (COP)'}</label>
                        <input
                            required
                            id="rent"
                            name="rent"
                            value={formData.rent}
                            onChange={handleChange}
                            type="number"
                            className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 text-sm"
                            placeholder="0"
                        />
                    </div>
                    <div>
                        <label htmlFor="owner" className="block text-xs font-bold text-gray-500 mb-1">Propietario Asignado</label>
                        <select
                            required
                            id="owner"
                            name="owner"
                            value={formData.owner}
                            onChange={handleChange}
                            className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 text-sm"
                        >
                            <option value="" disabled>Seleccionar Propietario</option>
                            {users.filter(u => u.role === 'Propietario' || u.role === 'Owner').map(u => (
                                <option key={u.id} value={u.name} data-id={u.id}>
                                    {u.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* New Attributes Section */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="sqMeters" className="block text-xs font-bold text-gray-500 mb-1">Metraje (m²)</label>
                        <input
                            required
                            id="sqMeters"
                            name="sqMeters"
                            value={formData.sqMeters}
                            onChange={handleChange}
                            type="number"
                            className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 text-sm"
                            placeholder="Ej: 85"
                        />
                    </div>
                    <div>
                        <label htmlFor="parking" className="block text-xs font-bold text-gray-500 mb-1">Estacionamientos</label>
                        <input
                            required
                            id="parking"
                            name="parking"
                            value={formData.parking}
                            onChange={handleChange}
                            type="number"
                            className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 text-sm"
                            placeholder="Ej: 1"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="rooms" className="block text-xs font-bold text-gray-500 mb-1">Habitaciones</label>
                        <input
                            required
                            id="rooms"
                            name="rooms"
                            value={formData.rooms}
                            onChange={handleChange}
                            type="number"
                            className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 text-sm"
                            placeholder="Ej: 3"
                        />
                    </div>
                    <div>
                        <label htmlFor="bathrooms" className="block text-xs font-bold text-gray-500 mb-1">Baños</label>
                        <input
                            required
                            id="bathrooms"
                            name="bathrooms"
                            value={formData.bathrooms}
                            onChange={handleChange}
                            type="number"
                            className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 text-sm"
                            placeholder="Ej: 2"
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="description" className="block text-xs font-bold text-gray-500 mb-1">Descripción / Notas</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 text-sm"
                        placeholder="Detalles adicionales del inmueble..."
                    ></textarea>
                </div>
                <div>
                    <label htmlFor="image" className="block text-xs font-bold text-gray-500 mb-1">Foto Principal</label>
                    <input
                        type="file"
                        id="image"
                        name="image"
                        accept="image/*"
                        onChange={(e) => {
                            console.log('✍️ [FORM] Imagen seleccionada');
                            setPropertyImage(e.target.files?.[0] || null)
                        }}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-primary file:text-white hover:file:bg-primary-dark cursor-pointer"
                    />
                </div>

                {/* Status Change Section - Highlighted */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/50">
                    <label htmlFor="status" className="block text-xs font-bold text-primary dark:text-blue-300 uppercase mb-2 flex items-center gap-2">
                        <span className="material-icons-round text-sm">info</span> Estatus Actual
                    </label>
                    {/* Dynamic Status Options based on formListingType */}
                    <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full rounded-lg border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800 text-sm font-medium"
                    >
                        <option value="Disponible">Disponible</option>
                        <option value="Desistido">Desistido</option>
                        {formListingType === 'Venta' && <option value="Vendido">Vendido</option>}
                        {formListingType === 'Arriendo' && <option value="Arrendado">Arrendado</option>}
                    </select>
                </div>

                <button type="submit" className="w-full bg-primary text-white py-2.5 rounded-lg font-bold text-sm mt-2 hover:bg-primary-dark shadow-lg">
                    {initialData ? "Actualizar Propiedad" : "Guardar Propiedad"}
                </button>
            </form>
        </Modal>
    );
};
