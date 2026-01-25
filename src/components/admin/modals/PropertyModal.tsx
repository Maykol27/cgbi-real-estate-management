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

    // Fix: Show spinner if initialData is expected but missing (though usually handled by parent state)
    // Here we just render the form. If initialData is null, it's "New Property" mode.

    if (!isOpen) return null;

    return (
        <Modal
            title={initialData ? "Editar Propiedad y Estatus" : "Registrar Nueva Propiedad"}
            onClose={onClose}
            zIndex={50} // Critical Fix
        >
            <form onSubmit={onSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Nombre / Identificador</label>
                    <input required name="name" defaultValue={initialData?.name} type="text" className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 text-sm" placeholder="Ej: Apto 301 - Edif. Solar" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Dirección</label>
                    <input required name="address" defaultValue={initialData?.address} type="text" className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Tipo de Operación</label>
                        <select
                            name="listingType"
                            value={formListingType}
                            onChange={(e) => setFormListingType(e.target.value as 'Venta' | 'Arriendo')}
                            className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 text-sm"
                        >
                            <option value="Arriendo">Arriendo</option>
                            <option value="Venta">Venta</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Tipo Inmueble</label>
                        <select name="type" defaultValue={initialData?.type || "Apartamento"} className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 text-sm">
                            <option>Apartamento</option>
                            <option>Casa</option>
                            <option>Local</option>
                            <option>Oficina</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">{formListingType === 'Venta' ? 'Precio Venta (COP)' : 'Canon (COP)'}</label>
                        <input required name="rent" defaultValue={initialData?.rent} type="number" className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 text-sm" placeholder="0" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Propietario Asignado</label>
                        <select
                            required
                            name="owner"
                            defaultValue={initialData?.owner || ""}
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
                        <label className="block text-xs font-bold text-gray-500 mb-1">Metraje (m²)</label>
                        <input required name="sqMeters" defaultValue={initialData?.sqMeters} type="number" className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 text-sm" placeholder="Ej: 85" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Estacionamientos</label>
                        <input required name="parking" defaultValue={initialData?.parking} type="number" className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 text-sm" placeholder="Ej: 1" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Habitaciones</label>
                        <input required name="rooms" defaultValue={initialData?.rooms} type="number" className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 text-sm" placeholder="Ej: 3" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Baños</label>
                        <input required name="bathrooms" defaultValue={initialData?.bathrooms} type="number" className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 text-sm" placeholder="Ej: 2" />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Descripción / Notas</label>
                    <textarea name="description" defaultValue={initialData?.description} rows={3} className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 text-sm" placeholder="Detalles adicionales del inmueble..."></textarea>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Foto Principal</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setPropertyImage(e.target.files?.[0] || null)}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-primary file:text-white hover:file:bg-primary-dark cursor-pointer"
                    />
                </div>

                {/* Status Change Section - Highlighted */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/50">
                    <label className="block text-xs font-bold text-primary dark:text-blue-300 uppercase mb-2 flex items-center gap-2">
                        <span className="material-icons-round text-sm">info</span> Estatus Actual
                    </label>
                    {/* Dynamic Status Options based on formListingType */}
                    <select name="status" defaultValue={initialData?.status || "Disponible"} className="w-full rounded-lg border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800 text-sm font-medium">
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
