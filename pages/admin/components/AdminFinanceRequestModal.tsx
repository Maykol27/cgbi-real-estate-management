
import React, { useState } from "react";
import { Modal } from "../../../components/Modal";
import { useStore } from "../../../context/StoreContext";
import { useToast } from "../../../context/ToastContext";

// Remove broken import
// import { FinanceRequest } from "../../../types";

interface AdminFinanceRequestModalProps {
    onClose: () => void;
    request?: any; // Use any to bypass import error
}

export const AdminFinanceRequestModal: React.FC<AdminFinanceRequestModalProps> = ({ onClose, request }) => {
    const { addFinanceRequest, properties } = useStore();
    const { showToast } = useToast();

    const [formData, setFormData] = useState({
        title: request?.title || "",
        desc: request?.desc || "",
        cost: request?.cost?.toString() || "",
        propertyId: request?.propertyId?.toString() || ""
    });

    const isReadOnly = !!request;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isReadOnly) {
            onClose();
            return;
        }
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
        <Modal title={isReadOnly ? "Detalle de Solicitud" : "Nueva Solicitud Financiera"} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Inmueble</label>
                    <select
                        value={formData.propertyId}
                        disabled={isReadOnly}
                        onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 disabled:opacity-70"
                        required
                    >
                        <option value="">Seleccione una propiedad...</option>
                        {properties.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título</label>
                    <input
                        type="text"
                        value={formData.title}
                        disabled={isReadOnly}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 disabled:opacity-70"
                        placeholder="Ej: Reparación de tubería"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                    <textarea
                        value={formData.desc}
                        disabled={isReadOnly}
                        onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 disabled:opacity-70"
                        rows={3}
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Costo Estimado</label>
                    <input
                        type="number"
                        value={formData.cost}
                        disabled={isReadOnly}
                        onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 disabled:opacity-70"
                        placeholder="0"
                        required
                    />
                </div>

                {request && (
                    <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700 mt-4">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-gray-500 uppercase">Estado</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${request.status === 'Aprobado' ? 'bg-green-100 text-green-700' :
                                request.status === 'Rechazado' ? 'bg-red-100 text-red-700' :
                                    'bg-yellow-100 text-yellow-700'
                                }`}>{request.status}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-500 uppercase">Solicitante</span>
                            <span className="text-sm font-medium dark:text-gray-300">{request.requester}</span>
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cerrar</button>
                    {!isReadOnly && <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark">Crear Solicitud</button>}
                </div>
            </form>
        </Modal>
    );
};
