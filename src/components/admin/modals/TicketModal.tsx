import React from 'react';
import { Modal } from '../../ui/Modal';
import { useStore } from '../../../../context/StoreContext';

const SimpleBadge: React.FC<{ color: string; text: string }> = ({ color, text }) => {
    const bgMap: Record<string, string> = {
        green: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
        red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        gray: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${bgMap[color] || bgMap.gray}`}>
            {text}
        </span>
    );
};

interface TicketCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
}

export const TicketCreateModal: React.FC<TicketCreateModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const { users } = useStore();
    const collaborators = users?.filter(u => u.role === 'Colaborador') || [];

    // Controlled State - REGLA 3: Safe Rendering
    const [formData, setFormData] = React.useState({
        title: '',
        type: 'Tareas CGBI',
        priority: 'Media',
        assignedTo: '',
        desc: ''
    });

    React.useEffect(() => {
        if (isOpen) {
            console.log('📦 [MODAL] Abriendo Crear Ticket');
            // Reset form on open
            setFormData({
                title: '',
                type: 'Tareas CGBI',
                priority: 'Media',
                assignedTo: '',
                desc: ''
            });
        }
    }, [isOpen]);

    // REGLA 2: Inputs have matching name/id
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // NO EARLY RETURN - Let Modal.tsx handle visibility
    return (
        <Modal title="Crear Nuevo Ticket / Tarea" onClose={onClose} zIndex={50}>
            <form onSubmit={onSubmit} className="space-y-4">
                {/* REGLA 2 & 3: IDs + Safe Values */}
                <div>
                    <label htmlFor="ticket-title" className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                        Título / Asunto
                    </label>
                    <input
                        required
                        id="ticket-title"
                        name="title"
                        value={formData?.title || ''}
                        onChange={handleChange}
                        type="text"
                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 dark:text-white text-sm px-3 py-2"
                        placeholder="Ej: Revisión Mensual de Cuentas"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="ticket-type" className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                            Tipo de Solicitud
                        </label>
                        <select
                            id="ticket-type"
                            name="type"
                            value={formData?.type || 'Tareas CGBI'}
                            onChange={handleChange}
                            className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 dark:text-white text-sm px-3 py-2"
                        >
                            <option value="Tareas CGBI">Tareas CGBI</option>
                            <option value="Mantenimiento">Mantenimiento</option>
                            <option value="Administrativo">Administrativo</option>
                            <option value="PQRS / Felicitaciones">PQRS / Felicitaciones</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="ticket-priority" className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                            Prioridad
                        </label>
                        <select
                            id="ticket-priority"
                            name="priority"
                            value={formData?.priority || 'Media'}
                            onChange={handleChange}
                            className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 dark:text-white text-sm px-3 py-2"
                        >
                            <option value="Baja">Baja</option>
                            <option value="Media">Media</option>
                            <option value="Alta">Alta</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label htmlFor="ticket-assignedTo" className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                        Asignar Colaborador (Opcional)
                    </label>
                    <select
                        id="ticket-assignedTo"
                        name="assignedTo"
                        value={formData?.assignedTo || ''}
                        onChange={handleChange}
                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 dark:text-white text-sm px-3 py-2"
                    >
                        <option value="">-- Sin Asignar --</option>
                        {collaborators.map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="ticket-desc" className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                        Descripción Detallada
                    </label>
                    <textarea
                        required
                        id="ticket-desc"
                        name="desc"
                        value={formData?.desc || ''}
                        onChange={handleChange}
                        rows={4}
                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 dark:text-white text-sm px-3 py-2"
                        placeholder="Detalles de la tarea o ticket..."
                    ></textarea>
                </div>

                <button type="submit" className="w-full bg-primary text-white py-2.5 rounded-lg font-bold text-sm mt-2 shadow-lg hover:bg-primary-dark transition-colors">
                    Crear Ticket
                </button>
            </form>
        </Modal>
    );
};

interface TicketDetailModalProps {
    ticket: any;
    onClose: () => void;
    onUpdateStatus: (status: string) => void;
    onUpdatePriority: (priority: string) => void;
    onSendReply: () => void;
    replyText: string;
    setReplyText: (text: string) => void;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
    ticket,
    onClose,
    onUpdateStatus,
    onUpdatePriority,
    onSendReply,
    replyText,
    setReplyText
}) => {

    React.useEffect(() => {
        if (ticket) console.log('📦 [MODAL] Detalle Ticket Abierto:', ticket.id, ticket);
    }, [ticket]);

    // Early return but SAFE - REGLA 3
    if (!ticket) return null;

    return (
        <Modal title={`Ticket #${ticket?.id || 'N/A'}`} onClose={onClose} maxWidth="max-w-2xl" zIndex={50}>
            <div className="flex flex-col h-[500px]">
                {/* Info Header */}
                <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                    <div>
                        <h4 className="font-bold text-lg text-gray-800 dark:text-white">{ticket?.title || 'Sin título'}</h4>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                Solicitado por: <span className="font-medium text-gray-700 dark:text-gray-300">{ticket?.requester || 'Desconocido'}</span> ({ticket?.requesterRole || 'N/A'})
                            </span>
                        </div>
                        <div className="mt-2 bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Descripción</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{ticket?.desc || 'Sin descripción'}</p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <SimpleBadge
                            color={ticket?.status === 'Pendiente' ? 'red' : ticket?.status === 'En Progreso' ? 'blue' : 'gray'}
                            text={ticket?.status || 'Sin estado'}
                        />
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-400">Prioridad:</span>
                            <select
                                id="status-update-priority"
                                name="status-update-priority"
                                aria-label="Cambiar Prioridad"
                                value={ticket?.priority || 'Media'}
                                onChange={(e) => onUpdatePriority(e.target.value)}
                                className="text-xs border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 dark:text-white rounded px-2 py-0.5"
                            >
                                <option value="Baja">Baja</option>
                                <option value="Media">Media</option>
                                <option value="Alta">Alta</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto mb-4 bg-gray-50 dark:bg-slate-900 rounded-xl p-4 border border-gray-100 dark:border-gray-700 flex flex-col gap-3">
                    {ticket?.messages && ticket.messages.length > 0 ? (
                        ticket.messages.map((msg: any, idx: number) => (
                            <div key={idx} className={`flex flex-col ${msg?.role === 'Admin' ? 'items-end' : 'items-start'}`}>
                                <div className={`max-w-[80%] p-3 rounded-xl text-sm ${msg?.role === 'Admin'
                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                    : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-600 rounded-tl-none text-gray-800 dark:text-white'
                                    }`}>
                                    <p>{msg?.text || ''}</p>
                                </div>
                                <span className="text-[10px] text-gray-400 mt-1 px-1">{msg?.sender || 'Usuario'} • {msg?.time || ''}</span>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-50">
                            <span className="material-icons-round text-4xl mb-2">chat_bubble_outline</span>
                            <p className="text-sm">No hay mensajes aún.</p>
                        </div>
                    )}
                </div>

                {/* Reply Box */}
                <div className="relative">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            id="reply-box"
                            name="reply-box"
                            aria-label="Escribir respuesta"
                            value={replyText || ''}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Escribe una respuesta... (Enter para enviar)"
                            className="flex-1 rounded-xl border-gray-200 dark:border-gray-600 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/50 dark:text-white px-3 py-2"
                            onKeyDown={(e) => e.key === 'Enter' && onSendReply()}
                        />
                        <button onClick={onSendReply} className="bg-primary hover:bg-primary-dark text-white p-2.5 rounded-xl transition-colors shadow-md">
                            <span className="material-icons-round">send</span>
                        </button>
                    </div>
                    <div className="flex gap-2 mt-2 justify-end">
                        {['Pendiente', 'En Progreso', 'Resuelto', 'Cerrado'].map((status) => (
                            <button
                                key={status}
                                onClick={() => onUpdateStatus(status)}
                                className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${ticket?.status === status
                                    ? 'bg-gray-800 text-white border-gray-800 dark:bg-white dark:text-gray-900'
                                    : 'bg-transparent text-gray-500 border-gray-200 hover:border-gray-400'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </Modal>
    );
};
