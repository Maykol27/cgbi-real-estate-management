
import React, { useState } from "react";
import { Modal } from "../../../components/Modal";
import { useStore } from "../../../context/StoreContext";
import { useToast } from "../../../context/ToastContext";

interface AdminFinanceRequestModalProps {
    onClose: () => void;
}

export const AdminFinanceRequestModal: React.FC<AdminFinanceRequestModalProps> = ({ onClose }) => {
    const { addFinanceRequest, properties } = useStore();
    const { showToast } = useToast();

    const [formData, setFormData] = useState({
        title: "",
        desc: "",
        cost: "",
        propertyId: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.desc || !formData.cost || !formData.propertyId) {
            showToast("Por favor complete todos los campos", "error");
            return;
        }

        try {
            await addFinanceRequest({
                title: formData.title,
                desc: formData.desc,
                cost: formData.cost,
                propertyId: formData.propertyId,
                requester: "Administración" // Mock requester, Store handles the ID
            });
            showToast("Solicitud creada exitosamente", "success");
            onClose();
        } catch (error) {
            console.error(error);
            showToast("Error al crear solicitud", "error");
        }
    };

    return (
        <Modal title="Nueva Solicitud Financiera" onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Inmueble</label>
                    <select
                        value={formData.propertyId}
                        onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800"
                        required
                    >
                        <option value="">Seleccione una propiedad...</option>
                        {properties.map(p => (
                            <option key={p.id} value={p.id}>{p.name} - {p.owner}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título</label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800"
                        placeholder="Ej: Reparación de tubería"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                    <textarea
                        value={formData.desc}
                        onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800"
                        rows={3}
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Costo Estimado</label>
                    <input
                        type="number"
                        value={formData.cost}
                        onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800"
                        placeholder="0"
                        required
                    />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark">Crear Solicitud</button>
                </div>
            </form>
        </Modal>
    );
};
