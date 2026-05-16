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
        status: 'Disponible',
        contractEnd: ''
    });

    // Sync with initialData when modal opens
    React.useEffect(() => {
        if (isOpen) {
            console.log('📦 [MODAL] Recibiendo datos (PropertyModal):', initialData);
            setFormData({
                name: initialData?.name || '',
                address: initialData?.address || '',
                type: initialData?.type || 'Apartamento',
                rent: initialData?.rent || '',
                owner: initialData?.owner || '',
                owner_id: initialData?.owner_id || '',
                sqMeters: initialData?.sqMeters || '',
                parking: initialData?.parking || '',
                rooms: initialData?.rooms || '',
                bathrooms: initialData?.bathrooms || '',
                description: initialData?.description || '',
                status: initialData?.status || 'Disponible',
                contractEnd: initialData?.contractEnd || ''
            });
        }
    }, [isOpen, initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('🚀 [CRUD] Enviando a BD (wrapper)...', formData);
        onSubmit(e);
    };

    return (
        <Modal
            isOpen={isOpen}
            title={initialData ? "Editar Propiedad y Estatus" : "Registrar Nueva Propiedad"}
            onClose={onClose}
            size="lg"
            zIndex={50}
        >
            <form onSubmit={handleFormSubmit} className="space-y-4">
                {/* Property Name */}
                <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                        Nombre / Identificador
                    </label>
                    <input
                        required
                        id="name"
                        name="name"
                        value={formData?.name || ''}
                        onChange={handleChange}
                        type="text"
                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F9FAFB] text-sm px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#D62C5E] focus:border-transparent transition-all"
                        placeholder="Ej: Apto 301 - Edif. Solar"
                    />
                </div>

                {/* Address */}
                <div>
                    <label htmlFor="address" className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                        Dirección
                    </label>
                    <input
                        required
                        id="address"
                        name="address"
                        value={formData?.address || ''}
                        onChange={handleChange}
                        type="text"
                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F9FAFB] text-sm px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#D62C5E] focus:border-transparent transition-all"
                        placeholder="Ej: Calle 123 #45-67"
                    />
                </div>

                {/* Listing Type & Property Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="listingType" className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                            Tipo de Operación
                        </label>
                        <select
                            id="listingType"
                            name="listingType"
                            value={formListingType || 'Arriendo'}
                            onChange={(e) => {
                                console.log('✍️ [FORM] Cambio listingType:', e.target.value);
                                setFormListingType(e.target.value as 'Venta' | 'Arriendo');
                            }}
                            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F9FAFB] text-sm px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#D62C5E] focus:border-transparent transition-all"
                        >
                            <option value="Arriendo">Arriendo</option>
                            <option value="Venta">Venta</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="type" className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                            Tipo Inmueble
                        </label>
                        <select
                            id="type"
                            name="type"
                            value={formData?.type || 'Apartamento'}
                            onChange={handleChange}
                            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F9FAFB] text-sm px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#D62C5E] focus:border-transparent transition-all"
                        >
                            <option>Apartamento</option>
                            <option>Casa</option>
                            <option>Local</option>
                            <option>Oficina</option>
                        </select>
                    </div>
                </div>

                {/* Rent/Price & Owner */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="rent" className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                            {formListingType === 'Venta' ? 'Precio Venta (COP)' : 'Canon (COP)'}
                        </label>
                        <input
                            required
                            id="rent"
                            name="rent"
                            value={formData?.rent || ''}
                            onChange={handleChange}
                            type="number"
                            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F9FAFB] text-sm px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#D62C5E] focus:border-transparent transition-all"
                            placeholder="0"
                        />
                    </div>
                    <div>
                        <label htmlFor="owner" className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                            Propietario Asignado
                        </label>
                        <select
                            required
                            id="owner"
                            name="owner"
                            value={formData?.owner || ''}
                            onChange={handleChange}
                            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F9FAFB] text-sm px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#D62C5E] focus:border-transparent transition-all"
                        >
                            <option value="" disabled>Seleccionar Propietario</option>
                            {users?.filter(u => u.role === 'Propietario' || u.role === 'Owner').map(u => (
                                <option key={u.id} value={u.name} data-id={u.id}>
                                    {u.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Square Meters & Parking */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="sqMeters" className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                            Metraje (m²)
                        </label>
                        <input
                            required
                            id="sqMeters"
                            name="sqMeters"
                            value={formData?.sqMeters || ''}
                            onChange={handleChange}
                            type="number"
                            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F9FAFB] text-sm px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#D62C5E] focus:border-transparent transition-all"
                            placeholder="Ej: 85"
                        />
                    </div>
                    <div>
                        <label htmlFor="parking" className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                            Estacionamientos
                        </label>
                        <input
                            required
                            id="parking"
                            name="parking"
                            value={formData?.parking || ''}
                            onChange={handleChange}
                            type="number"
                            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F9FAFB] text-sm px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#D62C5E] focus:border-transparent transition-all"
                            placeholder="Ej: 1"
                        />
                    </div>
                </div>

                {/* Rooms & Bathrooms */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="rooms" className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                            Habitaciones
                        </label>
                        <input
                            required
                            id="rooms"
                            name="rooms"
                            value={formData?.rooms || ''}
                            onChange={handleChange}
                            type="number"
                            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F9FAFB] text-sm px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#D62C5E] focus:border-transparent transition-all"
                            placeholder="Ej: 3"
                        />
                    </div>
                    <div>
                        <label htmlFor="bathrooms" className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                            Baños
                        </label>
                        <input
                            required
                            id="bathrooms"
                            name="bathrooms"
                            value={formData?.bathrooms || ''}
                            onChange={handleChange}
                            type="number"
                            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F9FAFB] text-sm px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#D62C5E] focus:border-transparent transition-all"
                            placeholder="Ej: 2"
                        />
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label htmlFor="description" className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                        Descripción / Notas
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData?.description || ''}
                        onChange={handleChange}
                        rows={3}
                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F9FAFB] text-sm px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#D62C5E] focus:border-transparent transition-all resize-none"
                        placeholder="Detalles adicionales del inmueble..."
                    ></textarea>
                </div>

                {/* Contract End Date */}
                <div>
                    <label htmlFor="contractEnd" className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                        Fin de Contrato
                    </label>
                    <input
                        id="contractEnd"
                        name="contractEnd"
                        value={formData?.contractEnd || ''}
                        onChange={handleChange}
                        type="date"
                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F9FAFB] text-sm px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#D62C5E] focus:border-transparent transition-all"
                    />
                </div>

                {/* Image Upload */}
                <div>
                    <label htmlFor="image" className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                        Foto Principal
                    </label>
                    {initialData?.image && (
                        <div className="mb-3">
                            <p className="text-xs text-gray-500 mb-1">Imagen actual:</p>
                            <img src={initialData.image} alt="Imagen actual de la propiedad" className="w-full h-40 object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
                        </div>
                    )}
                    <input
                        type="file"
                        id="image"
                        name="image"
                        accept="image/*"
                        onChange={(e) => {
                            console.log('✍️ [FORM] Imagen seleccionada');
                            setPropertyImage(e.target.files?.[0] || null)
                        }}
                        className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-bold file:bg-[#D62C5E] file:text-white hover:file:bg-[#A01B44] file:cursor-pointer file:transition-all"
                    />
                </div>

                {/* Status Change Section - CGBI Branded */}
                <div className="bg-[#D62C5E]/5 dark:bg-[#D62C5E]/10 p-4 rounded-xl border border-[#D62C5E]/20 dark:border-[#D62C5E]/30">
                    <label htmlFor="status" className="block text-sm font-bold text-[#D62C5E] uppercase mb-2 flex items-center gap-2">
                        <span className="material-icons-round text-base">info</span> Estatus Actual
                    </label>
                    <select
                        id="status"
                        name="status"
                        value={formData?.status || 'Disponible'}
                        onChange={handleChange}
                        className="w-full rounded-md border border-[#D62C5E]/20 dark:border-[#D62C5E]/40 bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F9FAFB] text-sm font-semibold px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#D62C5E] focus:border-transparent transition-all"
                    >
                        <option value="Disponible">Disponible</option>
                        <option value="Desistido">Desistido</option>
                        {formListingType === 'Venta' && <option value="Vendido">Vendido</option>}
                        {formListingType === 'Arriendo' && <option value="Arrendado">Arrendado</option>}
                    </select>
                </div>

                {/* Action Buttons - CGBI Branded - Mobile First */}
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
                        {initialData ? "Actualizar Propiedad" : "Guardar Propiedad"}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
