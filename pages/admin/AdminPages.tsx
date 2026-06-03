import React, { useState, useRef, useEffect } from 'react';
import { AdminFinanceRequestModal } from './components/AdminFinanceRequestModal';
import { ThemeToggle, Logo, NotificationButton } from '../../components/Layout';
import { HeaderProfile } from '../../components/HeaderProfile';
import { useStore } from '../../context/StoreContext';
import { Calendar } from '../../components/Calendar';
import { Modal } from '../../src/components/ui/Modal';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils';
import { PropertyModal } from '../../src/components/admin/modals/PropertyModal';
import { UserModal } from '../../src/components/admin/modals/UserModal';
import { TicketCreateModal, TicketDetailModal } from '../../src/components/admin/modals/TicketModal';

// --- Shared Components ---
const SectionHeader: React.FC<{ title: string; subtitle?: string; action?: React.ReactNode }> = ({ title, subtitle, action }) => (
    <header className="bg-white dark:bg-card-dark border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row items-start md:items-center justify-between px-6 py-4 md:py-0 md:h-24 gap-4 z-10 shadow-sm shrink-0 transition-colors">
        <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">{title}</h1>
            {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto justify-end">
            {action}
            <div className="flex items-center gap-2 border-l border-gray-200 dark:border-gray-700 pl-4 ml-2">
                <NotificationButton />
                <ThemeToggle />
                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                <HeaderProfile />
            </div>
        </div>
    </header>
);

const Badge: React.FC<{ color: string; text: string; icon?: string }> = ({ color, text, icon }) => {
    const bgMap: Record<string, string> = {
        green: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900',
        red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-900',
        blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-900',
        yellow: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-900',
        gray: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700',
        purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-900',
    };
    return (
        <span className={`inline - flex items - center gap - 1.5 px - 2.5 py - 0.5 rounded - full text - xs font - bold uppercase tracking - wider border ${bgMap[color] || bgMap.gray} `}>
            {icon && <span className="material-icons-round text-[14px]">{icon}</span>}
            {text}
        </span>
    );
};

// --- Admin Documents Page ---
export const AdminDocuments: React.FC = () => {
    // State from Store
    const { documents, addDocument, deleteDocument, addFinanceRequest, user, users, properties } = useStore();
    const { showToast } = useToast();

    // Permission Check
    if (user?.role === 'Colaborador' && !user.permissions?.includes('documentos')) {
        return <div className="flex items-center justify-center h-full text-gray-400 font-medium">No tienes permiso para acceder a Documentos.</div>;
    }

    const [searchTerm, setSearchTerm] = useState("");
    const [isDragOver, setIsDragOver] = useState(false);

    // Form State
    const [docType, setDocType] = useState("");
    const [recipient, setRecipient] = useState<string>("Todos");
    const [specificClient, setSpecificClient] = useState("");
    const [specificClientId, setSpecificClientId] = useState<string>(""); // Added for RLS
    const [cost, setCost] = useState("");
    const [desc, setDesc] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Confirm Modal State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [docToDelete, setDocToDelete] = useState<number | string | null>(null);

    const [showUserSuggestions, setShowUserSuggestions] = useState(false);
    const [selectedPropertyId, setSelectedPropertyId] = useState(""); // State for property selection

    // Handlers
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setSelectedFile(e.dataTransfer.files[0]);
        }
    };

    const handleUpload = () => {
        if (!selectedFile) {
            showToast("Por favor seleccione un archivo primero.", "error");
            return;
        }
        if (!docType) {
            showToast("Por favor seleccione el tipo de documento.", "error");
            return;
        }

        const fileUrl = URL.createObjectURL(selectedFile);

        if (docType === 'Solicitud') {
            if (!cost || !desc) {
                showToast("Para solicitudes de aprobación, el costo y la descripción son obligatorios.", "error");
                return;
            }
            if (!selectedPropertyId) {
                showToast("Debes asociar la solicitud a una propiedad.", "error");
                return;
            }

            // Find property name for better context if needed, though ID is main link
            const prop = properties.find(p => String(p.id) === String(selectedPropertyId));

            addFinanceRequest({
                title: "Solicitud: " + selectedFile.name,
                desc: desc,
                cost: cost,
                requester: "Admin CGBI",
                attachmentUrl: fileUrl,
                propertyId: selectedPropertyId // FIX: Link to property
            });
            showToast("Solicitud de aprobación enviada al propietario.", "success");
        }

        // Use Store Action
        console.log('📤 [DOC_UPLOAD] Enviando documento a Target ID:', specificClientId || 'General');

        addDocument({
            name: selectedFile.name,
            size: (selectedFile.size / 1024 / 1024).toFixed(2) + " MB",
            type: docType as any,
            target: recipient === "Cliente Específico" ? specificClient : recipient, // For display
            targetId: recipient === "Cliente Específico" ? specificClientId : undefined, // UUID for RLS
            fileUrl: fileUrl,
            file: selectedFile
        });

        // Reset Form
        setSelectedFile(null);
        setDocType("");
        setSpecificClient("");
        setCost("");
        setDesc("");
        setSelectedPropertyId(""); // Reset
        setShowUserSuggestions(false); // Reset suggestions
        if (fileInputRef.current) fileInputRef.current.value = "";

        // If it was just a request, we might not strictly need the 'addDocument' call above 
        // if the request itself handles the attachment logic, but purely for the "Documents" tab view we keep it.
        // However, standard flow implies we uploaded it.
        if (docType !== 'Solicitud') { // Avoid double notification if handled above
            showToast("Documento subido y notificado exitosamente.", "success");
        }
    };

    const confirmDelete = (id: number) => {
        setDocToDelete(id);
        setShowDeleteConfirm(true);
    };

    const executeDelete = () => {
        if (docToDelete) {
            deleteDocument(docToDelete);
            setShowDeleteConfirm(false);
            setDocToDelete(null);
            showToast("Documento eliminado.", "success");
        }
    };

    const filteredFiles = documents
        .filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => b.id - a.id);



    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
            <SectionHeader
                title="Gestión de Documentos"
                subtitle="Subir y gestionar archivos para Propietarios e Inquilinos"
            />

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <Modal title="Eliminar Documento" onClose={() => setShowDeleteConfirm(false)} maxWidth="max-w-sm">
                    <div className="text-center p-2">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="material-icons-round text-3xl">delete_forever</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">¿Está seguro?</h3>
                        <p className="text-sm text-gray-500 mb-6">Esta acción es permanente y no se puede deshacer.</p>
                        <div className="flex justify-center gap-3">
                            <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 text-gray-500 font-bold text-sm hover:text-gray-700">Cancelar</button>
                            <button onClick={executeDelete} className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-600/30">Sí, Eliminar</button>
                        </div>
                    </div>
                </Modal>
            )}

            <div className="flex-1 overflow-auto p-6 lg:p-10 space-y-8">

                {/* Upload Card */}
                <div className="bg-white dark:bg-card-dark rounded-3xl shadow-soft border border-gray-100 dark:border-gray-700 p-8 max-w-5xl mx-auto">
                    <div
                        className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-all cursor-pointer mb-8 ${isDragOver ? 'border-primary bg-blue-50 dark:bg-blue-900/10' : 'border-gray-300 dark:border-gray-600 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-slate-800'} `}
                        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                        />

                        <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
                            <span className="material-icons-round">cloud_upload</span>
                        </div>

                        {selectedFile ? (
                            <div className="animate-in fade-in zoom-in">
                                <p className="text-lg font-bold text-gray-800 dark:text-white">{selectedFile.name}</p>
                                <p className="text-sm text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB - Listo para subir</p>
                            </div>
                        ) : (
                            <>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Arrastra archivos aquí o haz clic para subir</h3>
                                <p className="text-sm text-gray-500 mt-2">Soporta PDF, DOCX, JPG (Max 10MB)</p>
                            </>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Tipo de Documento</label>
                            <select
                                value={docType}
                                onChange={(e) => setDocType(e.target.value)}
                                className="w-full rounded-xl border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/50 transition-all py-2.5 dark:text-white"
                            >
                                <option value="">Seleccionar Tipo...</option>
                                <option value="Factura / Recibo">Factura / Recibo</option>
                                <option value="Contrato">Contrato</option>
                                <option value="Contrato de Administración">Contrato de Administración</option>
                                <option value="Comunicación">Comunicación</option>
                                <option value="Solicitud">Solicitud</option>
                                <option value="Documento Personal">Documento Personal</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Destinatario</label>
                            <select
                                value={recipient}
                                onChange={(e) => setRecipient(e.target.value)}
                                className="w-full rounded-xl border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/50 transition-all py-2.5 dark:text-white"
                            >
                                <option value="Todos">General (Todos)</option>
                                <option value="Inquilinos">Inquilinos</option>
                                <option value="Propietarios">Propietarios</option>
                                <option value="Cliente Específico">Cliente Específico</option>
                            </select>
                        </div>
                    </div>

                    {/* Conditional Fields for Approval Request */}
                    {docType === 'Solicitud' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 animate-in fade-in slide-in-from-top-2">
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Propiedad Asociada</label>
                                <select
                                    value={selectedPropertyId}
                                    onChange={(e) => setSelectedPropertyId(e.target.value)}
                                    className="w-full rounded-xl border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/50 transition-all py-2.5 dark:text-white"
                                >
                                    <option value="">Seleccionar Propiedad...</option>
                                    {properties.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} - {p.owner}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Costo Estimado (COP)</label>
                                <input
                                    type="number"
                                    value={cost}
                                    onChange={(e) => setCost(e.target.value)}
                                    placeholder="Ej: 500000"
                                    className="w-full rounded-xl border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/50 transition-all py-2.5 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Descripción del Trabajo</label>
                                <textarea
                                    value={desc}
                                    onChange={(e) => setDesc(e.target.value)}
                                    placeholder="Describa el trabajo a realizar..."
                                    rows={1}
                                    className="w-full rounded-xl border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/50 transition-all py-2.5 dark:text-white"
                                />
                            </div>
                        </div>
                    )}

                    {/* Specific Client Input - Conditional with Autocomplete */}
                    <div className={`transition-all duration-300 overflow-visible ${recipient === 'Cliente Específico' ? 'opacity-100 mb-6' : 'opacity-0 max-h-0 overflow-hidden'} `}>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Cliente Específico</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={specificClient}
                                onChange={(e) => {
                                    setSpecificClient(e.target.value);
                                    setShowUserSuggestions(true);
                                }}
                                onFocus={() => setShowUserSuggestions(true)}
                                placeholder="Buscar por nombre..."
                                className="w-full rounded-xl border-gray-200 dark:border-gray-600 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/50 py-2.5 dark:text-white"
                            />
                            {showUserSuggestions && specificClient && users.filter(u => u.name.toLowerCase().includes(specificClient.toLowerCase())).length > 0 && (
                                <div className="absolute z-50 w-full bg-white dark:bg-card-dark border border-gray-100 dark:border-gray-700 rounded-xl mt-1 shadow-xl max-h-48 overflow-y-auto">
                                    {users.filter(u => u.name.toLowerCase().includes(specificClient.toLowerCase())).map(u => (
                                        <button
                                            key={u.id}
                                            onClick={() => {
                                                setSpecificClient(u.name);
                                                setSpecificClientId(u.id as string); // Save UUID
                                                setShowUserSuggestions(false); // Close dropdown on selection
                                            }}
                                            className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800 text-sm text-gray-700 dark:text-gray-200 border-b border-gray-50 dark:border-gray-800 last:border-0"
                                        >
                                            <span className="font-bold">{u.name}</span> <span className="text-xs text-gray-400">({u.role})</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-center">
                        <button
                            onClick={handleUpload}
                            className="bg-primary hover:bg-primary-dark text-white px-10 py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
                        >
                            <span className="material-icons-round">upload_file</span>
                            Subir Documento
                        </button>
                    </div>
                </div>

                {/* Recent Documents List - Hidden for Collaborators */}
                {user?.role !== 'Colaborador' && (
                    <div className="bg-white dark:bg-card-dark rounded-3xl shadow-soft border border-gray-100 dark:border-gray-700 overflow-hidden max-w-5xl mx-auto">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Documentos Recientes</h3>
                            <div className="relative w-full md:w-64">
                                <span className="material-icons-round absolute left-3 top-2.5 text-gray-400 text-sm">search</span>
                                <input
                                    type="text"
                                    placeholder="Buscar documento..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-50 dark:bg-slate-800 border-none text-xs focus:ring-1 focus:ring-primary dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-[#D62C5E]/10 dark:bg-[#D62C5E]/20 border-b border-[#D62C5E]/20 dark:border-[#D62C5E]/30">
                                        <th className="p-5 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Nombre Archivo</th>
                                        <th className="p-5 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Tipo</th>
                                        <th className="p-5 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Dirigido A</th>
                                        <th className="p-5 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Enviado por</th>
                                        <th className="p-5 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Fecha</th>
                                        <th className="p-5 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {filteredFiles.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                                                No se encontraron documentos.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredFiles.map((file) => (
                                            <tr key={file.id} className="group hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${file.type === 'Factura / Recibo' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                                            <span className="material-icons-round text-lg">
                                                                {file.type === 'Factura / Recibo' ? 'receipt' : file.type === 'Contrato' ? 'gavel' : 'description'}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-800 dark:text-white group-hover:text-primary transition-colors">{file.name}</p>
                                                            <p className="text-xs text-gray-400">{file.size}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                                                    {file.type}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge color={file.target.includes("Todos") ? "purple" : file.target.includes("Inquilinos") ? "blue" : "green"} text={file.target} />
                                                </td>
                                                <td className="px-6 py-4 text-xs font-medium text-gray-600 dark:text-gray-400">
                                                    {file.createdBy ? (users.find(u => String(u.id) === String(file.createdBy))?.name || 'Sistema') : 'Admin'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 font-medium">
                                                    {file.date}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button onClick={() => confirmDelete(file.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" title="Eliminar">
                                                            <span className="material-icons-round text-lg">delete</span>
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if (file.fileUrl) {
                                                                    const link = document.createElement('a');
                                                                    link.href = file.fileUrl;
                                                                    link.download = file.name;
                                                                    document.body.appendChild(link);
                                                                    link.click();
                                                                    document.body.removeChild(link);
                                                                    showToast("Descargando archivo...", "success");
                                                                } else {
                                                                    showToast("Descarga iniciada: " + file.name, "info");
                                                                }
                                                            }}
                                                            className="p-1.5 text-gray-400 hover:text-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                                                            title="Descargar"
                                                        >
                                                            <span className="material-icons-round text-lg">download</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Collaborator Document History - Only show own uploaded documents */}
                {user?.role === 'Colaborador' && (
                    <div className="bg-white dark:bg-card-dark rounded-3xl shadow-soft border border-gray-100 dark:border-gray-700 overflow-hidden max-w-5xl mx-auto">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Mi Historial de Documentos</h3>
                            <p className="text-sm text-gray-500 mt-1">Solo puedes ver los documentos que has subido</p>
                        </div>

                        {filteredFiles.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                    <span className="material-icons-round text-3xl text-gray-400">description</span>
                                </div>
                                <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-2">📄 Aún no has subido documentos</h4>
                                <p className="text-sm text-gray-500">Tu historial aparecerá aquí cuando subas tu primer archivo.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-[#D62C5E]/10 dark:bg-[#D62C5E]/20 border-b border-[#D62C5E]/20 dark:border-[#D62C5E]/30">
                                            <th className="p-5 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Nombre Archivo</th>
                                            <th className="p-5 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Tipo</th>
                                            <th className="p-5 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Dirigido A</th>
                                            <th className="p-5 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Fecha</th>
                                            <th className="p-5 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {filteredFiles.map((file) => (
                                            <tr key={file.id} className="group hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${file.type === 'Factura / Recibo' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                                            <span className="material-icons-round text-lg">
                                                                {file.type === 'Factura / Recibo' ? 'receipt' : file.type === 'Contrato' ? 'gavel' : 'description'}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-800 dark:text-white group-hover:text-primary transition-colors">{file.name}</p>
                                                            <p className="text-xs text-gray-400">{file.size}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                                                    {file.type}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge color={file.target.includes("Todos") ? "purple" : file.target.includes("Inquilinos") ? "blue" : "green"} text={file.target} />
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 font-medium">
                                                    {file.date}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => {
                                                            if (file.fileUrl) {
                                                                const link = document.createElement('a');
                                                                link.href = file.fileUrl;
                                                                link.download = file.name;
                                                                document.body.appendChild(link);
                                                                link.click();
                                                                document.body.removeChild(link);
                                                                showToast("Descargando archivo...", "success");
                                                            }
                                                        }}
                                                        className="p-1.5 text-gray-400 hover:text-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                                                        title="Descargar"
                                                    >
                                                        <span className="material-icons-round text-lg">download</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Properties Page (Admin) ---
export const AdminProperties: React.FC = () => {
    const { user, properties, updatePropertyStatus, updateProperty, addProperty, users } = useStore();
    const { showToast } = useToast();

    // Permission Check
    if (user?.role === 'Colaborador' && !user.permissions?.includes('propiedades')) {
        return <div className="flex items-center justify-center h-full text-gray-400 font-medium">No tienes permiso para acceder a Inmuebles.</div>;
    }

    const [searchTerm, setSearchTerm] = useState("");
    const [listingFilter, setListingFilter] = useState<'Venta' | 'Arriendo'>('Arriendo');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProp, setEditingProp] = useState<any>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [propToDelete, setPropToDelete] = useState<number | null>(null);
    const [propertyImage, setPropertyImage] = useState<File | null>(null);

    const [formListingType, setFormListingType] = useState<'Venta' | 'Arriendo'>('Arriendo'); // New State for Form

    const isCollaborator = user?.role === 'Colaborador';

    const handleSaveProperty = (e: React.FormEvent) => {
        e.preventDefault();
        // Log handled in Modal wrapper, but we log payload here too
        const form = e.target as HTMLFormElement;
        const imageUrl = propertyImage ? URL.createObjectURL(propertyImage) : undefined;

        const ownerSelect = form.elements.namedItem('owner') as HTMLSelectElement;
        const selectedOption = ownerSelect.options[ownerSelect.selectedIndex];
        const ownerName = ownerSelect.value;
        const ownerId = selectedOption?.getAttribute('data-id');

        const formData = {
            name: (form.elements.namedItem('name') as HTMLInputElement).value,
            address: (form.elements.namedItem('address') as HTMLInputElement).value,
            type: (form.elements.namedItem('type') as HTMLSelectElement).value,
            rent: (form.elements.namedItem('rent') as HTMLInputElement).value,
            owner: ownerName,
            owner_id: ownerId, // Pass the ID
            status: (form.elements.namedItem('status') as HTMLSelectElement)?.value as any, // 'Disponible' | 'Vendido' | ...
            listingType: formListingType, // Use controlled state value
            sqMeters: Number((form.elements.namedItem('sqMeters') as HTMLInputElement).value),
            rooms: Number((form.elements.namedItem('rooms') as HTMLInputElement).value),
            bathrooms: Number((form.elements.namedItem('bathrooms') as HTMLInputElement).value),
            parking: Number((form.elements.namedItem('parking') as HTMLInputElement).value),
            description: (form.elements.namedItem('description') as HTMLTextAreaElement).value,
            contractEnd: (form.elements.namedItem('contractEnd') as HTMLInputElement)?.value || '',
            image: imageUrl, // Optimistic preview
            imageFile: propertyImage || undefined // The actual file
        };

        console.log('🚀 [CRUD] Enviando a BD (Payload Final):', formData);

        if (editingProp) {
            // @ts-ignore
            updateProperty(editingProp.id, formData);
            console.log('✅ [CRUD] Actualización Exitosa (Update). ID:', editingProp.id);
            showToast("Propiedad actualizada exitosamente.", "success");
        } else {
            // @ts-ignore
            addProperty(formData);
            console.log('✅ [CRUD] Creación Exitosa (Create).');
            showToast("Propiedad creada exitosamente.", "success");
        }
        setIsModalOpen(false);
        setEditingProp(null);
        setPropertyImage(null);
    };

    const handleEdit = (prop: any) => {
        console.log('🟢 [UI] Clic en Editar. ID:', prop.id, 'Datos:', prop);

        // Critical UX Fix: Ensure state is set before opening
        setEditingProp(prop);
        setFormListingType(prop.listingType || 'Arriendo');

        // Small timeout to ensure Re-render? Not strictly necessary in React 18 auto-batching, 
        // but user requested "Force update". We just ensure ordering.
        setTimeout(() => {
            setIsModalOpen(true);
        }, 0);
    };

    const confirmDelete = (id: number) => {
        console.log('❌ [CRUD] Solicitando eliminación ID:', id);
        setPropToDelete(id);
        setShowDeleteConfirm(true);
    };

    const executeDelete = () => {
        if (propToDelete) {
            console.log('🚀 [CRUD] Ejecutando DELETE ID:', propToDelete);
            // Logic would go here
            showToast("Funcionalidad de eliminar pendiente (Demo).", "info");
        }
        setShowDeleteConfirm(false);
        setPropToDelete(null);
    };

    const filteredProps = properties.filter(p =>
        (p.listingType === listingFilter || (!p.listingType && listingFilter === 'Arriendo')) && // Default to Arriendo if undefined
        (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.owner.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
            <SectionHeader
                title="Gestión de Inmuebles"
                subtitle="Administración de propiedades, estados y asignaciones"
                action={
                    !isCollaborator && (
                        <button
                            onClick={() => { setEditingProp(null); setFormListingType(listingFilter); setIsModalOpen(true); }}
                            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg shadow-md flex items-center gap-2 text-sm font-medium transition-all"
                        >
                            <span className="material-icons-round">add</span> Nuevo Inmueble
                        </button>
                    )
                }
            />

            {/* Listing Type Toggle */}
            <div className="px-6 lg:px-10 mb-4 mt-8">
                <div className="flex flex-col md:flex-row gap-2 md:gap-4 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl w-full md:w-fit">
                    <button
                        onClick={() => setListingFilter('Arriendo')}
                        className={`w-full md:w-auto px-4 py-2 text-sm font-bold rounded-lg transition-all ${listingFilter === 'Arriendo' ? 'bg-white dark:bg-card-dark shadow-sm text-primary dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white'} `}
                    >
                        En Arriendo
                    </button>
                    <button
                        onClick={() => setListingFilter('Venta')}
                        className={`w-full md:w-auto px-4 py-2 text-sm font-bold rounded-lg transition-all ${listingFilter === 'Venta' ? 'bg-white dark:bg-card-dark shadow-sm text-primary dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white'} `}
                    >
                        En Venta
                    </button>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <Modal title="Eliminar Propiedad" onClose={() => setShowDeleteConfirm(false)} maxWidth="max-w-sm">
                    <div className="text-center p-2">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="material-icons-round text-3xl">delete_forever</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">¿Está seguro?</h3>
                        <p className="text-sm text-gray-500 mb-6">Se eliminará la propiedad y todo su historial.</p>
                        <div className="flex justify-center gap-3">
                            <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 text-gray-500 font-bold text-sm hover:text-gray-700">Cancelar</button>
                            <button onClick={executeDelete} className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-600/30">Sí, Eliminar</button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Property Modal */}
            <PropertyModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingProp(null); }}
                onSubmit={handleSaveProperty}
                initialData={editingProp}
                setPropertyImage={(file) => setPropertyImage(file)}
                setFormListingType={setFormListingType}
                formListingType={formListingType}
            />


            <div className="flex-1 overflow-auto p-6 lg:p-10">
                <div className="mb-6 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <span className="absolute left-3 top-2.5 material-icons-round text-gray-400">search</span>
                        <input
                            type="text"
                            placeholder="Buscar propiedad o propietario..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl border-none bg-white dark:bg-card-dark shadow-sm focus:ring-2 focus:ring-primary/50 dark:text-white transition-all"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-soft border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#D62C5E]/10 dark:bg-[#D62C5E]/20 border-b border-[#D62C5E]/20 dark:border-[#D62C5E]/30">
                                    <th className="p-5 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Propiedad</th>
                                    <th className="p-5 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Tipo / Dueño</th>
                                    <th className="p-5 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">{listingFilter === 'Venta' ? 'Precio' : 'Canon'}</th>
                                    <th className="p-5 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Estado</th>
                                    <th className="p-5 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredProps.map(prop => (
                                    <tr key={prop.id} className="group hover:bg-gray-50 dark:hover:bg-[#1E293B]/70 transition-colors">
                                        <td className="p-5">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-lg bg-[#D62C5E]/10 dark:bg-[#D62C5E]/20 flex items-center justify-center text-[#D62C5E] shrink-0 overflow-hidden">
                                                    {prop.image ? (
                                                        <img src={prop.image} alt={prop.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <span className="material-icons-round">
                                                            {prop.type === 'Apartamento' ? 'apartment' : prop.type === 'Casa' ? 'house' : 'storefront'}
                                                        </span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-[#111827] dark:text-[#F9FAFB] text-sm">{prop.name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{prop.address}</p>
                                                    {prop.listingType && (
                                                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#D62C5E]/10 text-[#D62C5E] dark:bg-[#D62C5E]/20 dark:text-[#F9FAFB] border border-[#D62C5E]/20 mt-1">
                                                            {prop.listingType}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">{prop.type}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{prop.owner}</p>
                                        </td>
                                        <td className="p-5 text-sm font-semibold text-[#111827] dark:text-[#F9FAFB]">{formatCurrency(Number(prop.rent))}</td>
                                        <td className="p-5">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${prop.status === 'Arrendado' || prop.status === 'Vendido' || prop.status === 'Ocupado'
                                                ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900'
                                                : prop.status === 'Disponible'
                                                    ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900'
                                                    : 'bg-[#D62C5E]/10 text-[#D62C5E] border-[#D62C5E]/20 dark:bg-[#D62C5E]/30 dark:text-[#F9FAFB] dark:border-[#D62C5E]/40'
                                                }`}>
                                                {prop.status}
                                            </span>
                                        </td>
                                        <td className="p-5 text-right">
                                            <button
                                                onClick={() => handleEdit(prop)}
                                                className="px-4 py-2 bg-[#D62C5E] hover:bg-[#A01B44] text-white rounded-md shadow-md transition-all mr-2 text-xs font-bold"
                                            >
                                                Editar / Estatus
                                            </button>
                                            {!isCollaborator && (
                                                <button
                                                    onClick={() => confirmDelete(prop.id)}
                                                    className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <span className="material-icons-round">delete</span>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div >
    );
};

// --- Tenants Page (Admin) ---
export const AdminTenants: React.FC = () => {
    const { user, users, addUser, payments, addPayment, properties, updateUserStatus } = useStore();
    const { showToast } = useToast();

    // Permission Check (Grouped with Properties)
    if (user?.role === 'Colaborador' && !user.permissions?.includes('propiedades')) {
        return <div className="flex items-center justify-center h-full text-gray-400 font-medium">No tienes permiso para acceder a Inquilinos.</div>;
    }

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [messageModalOpen, setMessageModalOpen] = useState(false);

    // DEBUG: Track modal state changes
    React.useEffect(() => {
        console.log('🟡 [TENANT] isModalOpen cambió a:', isModalOpen);
    }, [isModalOpen]);

    // Derived state from store
    const tenants = users.filter(u => u.role === 'Inquilino');

    const [selectedTenantProfile, setSelectedTenantProfile] = useState<any>(null);
    const [selectedTenantHistory, setSelectedTenantHistory] = useState<string | number | null>(null); // ID can be string (UUID) or number

    // Derived Payment History for Selected Tenant
    const tenantPayments = selectedTenantHistory
        ? payments.filter(p => String(p.tenant_id) === String(selectedTenantHistory)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        : [];

    const isCollaborator = user?.role === 'Colaborador';

    const handleAddTenant = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('🔘 Click detectado: Nuevo Inquilino');
        const form = e.target as HTMLFormElement;

        const firstName = (form.elements.namedItem('firstName') as HTMLInputElement)?.value;
        const lastName = (form.elements.namedItem('lastName') as HTMLInputElement)?.value;
        const email = (form.elements.namedItem('email') as HTMLInputElement)?.value;
        const policyNumber = (form.elements.namedItem('policyNumber') as HTMLInputElement)?.value;
        const propertyId = (form.elements.namedItem('propertyId') as HTMLSelectElement)?.value;

        if (!firstName || !lastName || !email) {
            showToast("Por favor complete todos los campos obligatorios", "error");
            return;
        }

        if (propertyId) console.log("🏠 Asignando propiedad:", propertyId);

        await addUser({
            name: `${firstName} ${lastName} `,
            role: 'Inquilino',
            email: email,
            policyNumber: policyNumber,
            propertyId: propertyId ? Number(propertyId) : undefined
        });

        setIsModalOpen(false);
        showToast("Inquilino registrado exitosamente.", "success");
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        setMessageModalOpen(false);
        showToast(`Mensaje enviado exitosamente a Inquilino.`, "success");
    };

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
            <SectionHeader
                title="Gestión de Inquilinos"
                subtitle="Directorio y control de acceso de arrendatarios"
                action={
                    !isCollaborator && (
                        <button
                            onClick={() => {
                                console.log('🔵 [TENANT] Botón "Registrar Inquilino" clickeado - Abriendo modal');
                                setIsModalOpen(true);
                                console.log('🔵 [TENANT] setIsModalOpen(true) ejecutado');
                            }}
                            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-md transition-all"
                        >
                            <span className="material-icons-round">person_add</span> Registrar Inquilino
                        </button>
                    )
                }
            />

            {/* Create Tenant Modal */}
            {/* Create Tenant Modal */}
            <UserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleAddTenant}
                userType="Inquilino"
            />

            {/* Payment History Modal */}
            {selectedTenantHistory && (
                <Modal isOpen={!!selectedTenantHistory} title={`Historial de Pagos`} onClose={() => setSelectedTenantHistory(null)} maxWidth="max-w-2xl">
                    <div className="flex flex-col h-[600px]">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg text-blue-600 dark:text-blue-300">
                                    <span className="material-icons-round text-xl">account_balance_wallet</span>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase">Estado de Cuenta</p>
                                    <select
                                        className={`text - sm font - bold border rounded - lg px - 3 py - 1.5 cursor - pointer outline - none focus: ring - 2 focus: ring - offset - 1 transition - all ${(users.find(u => u.id === selectedTenantHistory)?.financialStatus || 'Al Día') === 'En Mora'
                                            ? 'bg-red-100 text-red-700 border-red-200 focus:ring-red-500 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900'
                                            : (users.find(u => u.id === selectedTenantHistory)?.financialStatus || 'Al Día') === 'Pendiente de Pago'
                                                ? 'bg-orange-100 text-orange-800 border-orange-200 focus:ring-orange-500 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-900'
                                                : 'bg-emerald-100 text-emerald-800 border-emerald-200 focus:ring-emerald-500 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-900'
                                            } `}
                                        value={users.find(u => u.id === selectedTenantHistory)?.financialStatus || 'Al Día'}
                                        onChange={(e) => {
                                            const newStatus = e.target.value as any;
                                            updateUserStatus(selectedTenantHistory!, newStatus);
                                        }}
                                    >
                                        <option value="Al Día" className="bg-white text-gray-800 dark:bg-slate-800 dark:text-white">✅ Al día</option>
                                        <option value="Pendiente de Pago" className="bg-white text-gray-800 dark:bg-slate-800 dark:text-white">⚠️ Pendiente de Pago</option>
                                        <option value="En Mora" className="bg-white text-gray-800 dark:bg-slate-800 dark:text-white">⛔ En Mora</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl mb-4 border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-top-2">
                            <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 mb-2">Registrar Nuevo Pago (Manual)</h4>
                            <form
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    const form = e.target as HTMLFormElement;
                                    const amount = (form.elements.namedItem('amount') as HTMLInputElement).value;
                                    const period = (form.elements.namedItem('period') as HTMLInputElement).value;
                                    const statusVal = (form.elements.namedItem('status') as HTMLSelectElement).value;

                                    if (amount && period && selectedTenantHistory) {
                                        const res = await addPayment({
                                            amount: Number(amount),
                                            period,
                                            status: Number(statusVal),
                                            date: new Date().toISOString(),
                                            tenant_id: selectedTenantHistory
                                        });
                                        if (res.success) {
                                            form.reset();
                                        } else {
                                            showToast(res.message, "error");
                                        }
                                    }
                                }}
                                className="flex flex-col sm:flex-row gap-2 items-end"
                            >
                                <div className="flex-1 w-full">
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Periodo</label>
                                    <input name="period" required placeholder="Ej: Octubre 2026" className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-700 text-sm py-1.5 focus:ring-primary dark:text-white" />
                                </div>
                                <div className="flex-1 w-full">
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Monto</label>
                                    <input name="amount" type="number" required placeholder="0" className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-700 text-sm py-1.5 focus:ring-primary dark:text-white" />
                                </div>
                                <div className="flex-1 w-full">
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Estado</label>
                                    <select name="status" className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-700 text-sm py-1.5 focus:ring-primary dark:text-white">
                                        <option value="1">Pagado</option>
                                        <option value="0">Pendiente</option>
                                        <option value="2">En Mora</option>
                                    </select>
                                </div>
                                <button type="submit" className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-1">
                                    <span className="material-icons-round text-base">save</span> Registrar
                                </button>
                            </form>
                        </div>

                        <div className="flex-1 overflow-auto bg-white dark:bg-card-dark rounded-xl border border-gray-100 dark:border-gray-700">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-gray-50 dark:bg-slate-800 z-10">
                                    <tr>
                                        <th className="py-3 px-4 text-xs font-semibold uppercase text-gray-500">Fecha / Periodo</th>
                                        <th className="py-3 px-4 text-xs font-semibold uppercase text-gray-500">Monto</th>
                                        <th className="py-3 px-4 text-xs font-semibold uppercase text-gray-500 text-center">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {tenantPayments.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="py-8 text-center text-gray-400 text-sm">No hay pagos registrados.</td>
                                        </tr>
                                    ) : (
                                        tenantPayments.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                                <td className="py-3 px-4 text-sm dark:text-gray-300">
                                                    <p className="font-bold">{item.period}</p>
                                                    <span className="text-xs text-gray-400">{new Date(item.date).toLocaleDateString()}</span>
                                                </td>
                                                <td className="py-3 px-4 text-sm font-bold dark:text-white">{formatCurrency(item.amount)}</td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className={`
text - xs font - bold py - 1 px - 2 rounded - full border - none 
                                                        ${item.status === 1 ? 'bg-emerald-100 text-emerald-700' :
                                                            item.status === 2 ? 'bg-red-100 text-red-700' :
                                                                'bg-blue-100 text-blue-700'
                                                        }
`}>
                                                        {item.status === 1 ? 'Pagado' : item.status === 2 ? 'Mora' : 'Pendiente'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Tenant Profile Modal */}
            {selectedTenantProfile && (
                <Modal isOpen={!!selectedTenantProfile} title="Perfil de Inquilino" onClose={() => setSelectedTenantProfile(null)} maxWidth="max-w-xl">
                    <div className="flex flex-col items-center">
                        <div className="mb-6 h-20 w-32 bg-white rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-2 flex items-center justify-center">
                            <Logo className="h-full w-full" />
                        </div>

                        <div className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-700 shadow-lg overflow-hidden mb-4">
                            <img src={selectedTenantProfile.photoUrl || `https://i.pravatar.cc/150?u=${selectedTenantProfile.id}`} alt="Profile" className="w-full h-full object-cover" />
                        </div >
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-1">{selectedTenantProfile.name}</h2>
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold mb-6">Contrato Vigente</span>

                        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                                <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Inmueble</label>
                                <p className="text-sm font-semibold dark:text-white">{properties.find(p => String(p.id) === String(selectedTenantProfile.propertyId))?.name || 'Sin Inmueble'}</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                                <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Email</label>
                                <p className="text-sm font-semibold dark:text-white">{selectedTenantProfile.email}</p>
                            </div>
                        </div>

                        <div className="w-full border-t border-gray-100 dark:border-gray-700 pt-4 flex justify-between gap-3">
                            <button
                                onClick={() => { setSelectedTenantHistory(selectedTenantProfile.id); setSelectedTenantProfile(null); }}
                                className="w-full py-2.5 bg-blue-50 dark:bg-blue-900/20 text-primary dark:text-blue-300 rounded-lg text-sm font-bold hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                            >
                                <span className="material-icons-round text-lg">history</span> Ver Historial de Pagos
                            </button>
                        </div>
                    </div >
                </Modal >
            )}

            <div className="flex-1 overflow-auto p-6 lg:p-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tenants.map((currTenant) => (
                        <div key={currTenant.id} className="bg-white dark:bg-card-dark p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center hover:shadow-hover transition-all group relative">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-slate-800 p-1 mb-4">
                                <img src={currTenant.photoUrl || `https://i.pravatar.cc/150?u=${currTenant.id}`} alt="Tenant" className="w-full h-full rounded-full object-cover" />
                            </div>
                            <h3 className="font-bold text-lg text-gray-800 dark:text-white">{currTenant.name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{currTenant.email}</p>

                            <div className="flex gap-2 w-full mt-auto">
                                <button onClick={() => setSelectedTenantProfile(currTenant)} className="flex-1 py-2 bg-gray-50 dark:bg-slate-800 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1">
                                    <span className="material-icons-round text-sm">person</span> Perfil
                                </button>
                                <button onClick={() => setSelectedTenantHistory(currTenant.id)} className="flex-1 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs font-bold text-primary dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-center gap-1">
                                    <span className="material-icons-round text-sm">receipt_long</span> Historial
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div >
    );
};

// --- Owners Page (Admin) ---
export const AdminOwners: React.FC = () => {
    const { user, users, addUser } = useStore();
    const { showToast } = useToast();

    // Permission Check (Grouped with Properties)
    if (user?.role === 'Colaborador' && !user.permissions?.includes('propiedades')) {
        return <div className="flex items-center justify-center h-full text-gray-400 font-medium">No tienes permiso para acceder a Propietarios.</div>;
    }

    const [isModalOpen, setIsModalOpen] = useState(false);

    // Filter Users for Owners
    const owners = users.filter(u => u.role === 'Propietario');
    const isCollaborator = user?.role === 'Colaborador';
    // Permission Check: Collaborator can only see Owners if 'Users' permission? Default 'tickets', 'calendar', 'documents'. 
    // Assuming 'Users' implies access to Tenants/Owners. For now, strict check:
    // If Collaborator, check if permissions include 'users'. If not, redirect or hide?
    // User requirement: "Colaborador role has same views as Admin but restricted".
    // I'll assume they can VIEW owners/tenants if they have access.
    // Let's implement dynamic permission check for Add Button.

    const handleAddOwner = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('🔘 Click detectado: Nuevo Propietario');
        const form = e.target as HTMLFormElement;
        addUser({
            name: (form.elements[0] as HTMLInputElement).value + ' ' + (form.elements[1] as HTMLInputElement).value,
            role: 'Propietario',
            email: (form.elements[2] as HTMLInputElement).value
        });
        setIsModalOpen(false);
        showToast("Propietario registrado exitosamente.", "success");
    };

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
            <SectionHeader
                title="Gestión de Propietarios"
                subtitle="Directorio y portafolio de clientes propietarios"
                action={
                    !isCollaborator && (
                        <button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-md transition-all">
                            <span className="material-icons-round">person_add</span> Registrar Propietario
                        </button>
                    )
                }
            />

            {/* Create Owner Modal */}
            {/* Create Owner Modal */}
            <UserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleAddOwner}
                userType="Propietario"
            />

            <div className="flex-1 overflow-auto p-6 lg:p-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {owners.map((owner) => (
                        <div key={owner.id} className="bg-white dark:bg-card-dark p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center hover:shadow-hover transition-all group relative">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-100 to-purple-50 dark:from-purple-900/40 dark:to-slate-800 p-1 mb-4">
                                <img src={owner.photoUrl || `https://i.pravatar.cc/150?u=${owner.id}`} alt="Owner" className="w-full h-full rounded-full object-cover" />
                            </div>
                            <h3 className="font-bold text-lg text-gray-800 dark:text-white">{owner.name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{owner.email}</p>

                            <div className="w-full border-t border-gray-100 dark:border-gray-700 my-4"></div>

                            <button className="w-full py-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-xs font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors flex items-center justify-center gap-2">
                                <span className="material-icons-round text-sm">home_work</span> Ver Propiedades
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- Tickets Page (Admin) ---
export const AdminTickets: React.FC = () => {
    const { tickets, updateTicketStatus, updateTicketPriority, financeRequests, addMessageToTicket, users, assignTicket, properties } = useStore();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'tickets' | 'financial'>('tickets');
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [filterStatus, setFilterStatus] = useState("Todos");
    const [replyText, setReplyText] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [showFinanceModal, setShowFinanceModal] = useState(false);
    const [selectedFinanceRequest, setSelectedFinanceRequest] = useState<any>(null); // State for Finance Modal
    const { addTicket } = useStore();

    // Get Collaborators
    const collaborators = users.filter(u => u.role === 'Colaborador');

    // Permission Check
    const { user } = useStore(); // destructure user
    if (user?.role === 'Colaborador' && !user.permissions?.includes('tickets')) {
        return <div className="flex items-center justify-center h-full text-gray-400 font-medium">No tienes permiso para acceder a Tickets.</div>;
    }

    useEffect(() => {
        if (selectedTicket) {
            setReplyText("");
        }
    }, [selectedTicket]);

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('🚀 [CRUD] Solicitud Creación Ticket...');
        const form = e.target as HTMLFormElement;

        const payload = {
            title: (form.elements.namedItem('title') as HTMLInputElement).value,
            desc: (form.elements.namedItem('desc') as HTMLTextAreaElement).value,
            type: (form.elements.namedItem('type') as HTMLSelectElement).value as any,
            priority: (form.elements.namedItem('priority') as HTMLSelectElement).value as any,
            assigned_to: (form.elements.namedItem('assigned_to') as HTMLSelectElement).value || undefined,
            requester: `${user?.role} (${user?.name})`,
            requesterRole: user?.role || 'Admin',
            propertyId: undefined // Global admin task
        };
        console.log('📦 [CRUD] Payload Ticket:', payload);

        const result = await addTicket(payload);

        if (result.success) {
            console.log('✅ [CRUD] Ticket Creado. ID:', result.data?.id);
            setIsCreateModalOpen(false);
            showToast("Ticket/Tarea creada exitosamente.", "success");
        } else {
            console.error('❌ [CRUD] Error Creación Ticket:', result.message);
            showToast(result.message || "Error al crear ticket", "error");
        }
    };

    const handleUpdateStatus = (newStatus: string) => {
        console.log('✏️ [CRUD] Actualizando Estado Ticket:', selectedTicket.id, '->', newStatus);
        // Update Store
        updateTicketStatus(selectedTicket.id, newStatus as any);
    };

    const handleSendReply = () => {
        if (!replyText.trim()) return;

        addMessageToTicket(selectedTicket.id, {
            sender: user?.name || "Admin CGBI",
            role: "Admin",
            text: replyText
        });

        setReplyText("");

        // Auto-move to "En Progreso" if replying
        if (selectedTicket.status === 'Pendiente') {
            handleUpdateStatus('En Progreso');
        }
    };

    // CRITICAL: Filter tickets for collaborators - they only see assigned tickets
    let visibleTickets = tickets;
    if (user?.role === 'Colaborador') {
        visibleTickets = tickets.filter(t => String(t.assigned_to) === String(user.id));
        console.log(`🔍 [COLLABORATOR FILTER] User ${user.id} sees ${visibleTickets.length} assigned tickets`);
    }

    const filteredTickets = (filterStatus === "Todos" ? visibleTickets : visibleTickets.filter(t => t.status === filterStatus))
        .sort((a, b) => b.id - a.id);

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
            <SectionHeader
                title="Centro de Soporte"
                subtitle="Gestión de incidencias y solicitudes"
                action={
                    user?.role !== 'Colaborador' && (
                        <button onClick={() => setIsCreateModalOpen(true)} className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md flex items-center gap-2">
                            <span className="material-icons-round">add_task</span> Crear Ticket / Tarea
                        </button>
                    )
                }
            />

            {/* Create Ticket Modal */}
            {/* Create Ticket Modal */}
            <TicketCreateModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreateTicket}
            />

            {/* Ticket Detail Modal */}
            <TicketDetailModal
                ticket={selectedTicket ? (tickets.find(t => String(t.id) === String(selectedTicket.id)) || selectedTicket) : null}
                onClose={() => setSelectedTicket(null)}
                onUpdateStatus={handleUpdateStatus}
                onUpdatePriority={(newPriority) => updateTicketPriority(selectedTicket.id, newPriority as any)}
                onSendReply={handleSendReply}
                replyText={replyText}
                setReplyText={setReplyText}
                collaborators={collaborators}
                currentUser={user}
                onAssignCollaborator={(collaboratorId) => {
                    console.log('🔄 [ADMIN] Asignando ticket', selectedTicket.id, 'a colaborador', collaboratorId);
                    assignTicket(selectedTicket.id, collaboratorId);
                }}
            />

            <div className="flex-1 overflow-auto p-6 md:p-8">
                {/* Tabs Switcher */}
                <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setActiveTab('tickets')}
                        className={`pb-3 px-2 text-sm font-bold transition-colors relative ${activeTab === 'tickets' ? 'text-primary dark:text-white' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Tickets de Soporte
                        {activeTab === 'tickets' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></span>}
                    </button>
                    <button
                        onClick={() => setActiveTab('financial')}
                        className={`pb-3 px-2 text-sm font-bold transition-colors relative ${activeTab === 'financial' ? 'text-primary dark:text-white' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Aprobaciones Financieras
                        {activeTab === 'financial' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></span>}
                    </button>
                </div>

                {activeTab === 'tickets' ? (
                    <div className="flex gap-6 flex-col lg:flex-row h-full">
                        {/* Filters Sidebar */}
                        <div className="w-full lg:w-64 flex-shrink-0 space-y-2">
                            <div className="bg-white dark:bg-card-dark rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Estado</p>
                                <button
                                    onClick={() => setFilterStatus("Todos")}
                                    className={`w-full text-left px-3 py-2 rounded-lg font-medium text-sm mb-1 transition-colors ${filterStatus === "Todos" ? "bg-primary/10 text-primary dark:text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800"}`}
                                >
                                    Todos los Tickets
                                </button>
                                <button
                                    onClick={() => setFilterStatus("Pendiente")}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex justify-between ${filterStatus === "Pendiente" ? "bg-primary/10 text-primary dark:text-white font-medium" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800"}`}
                                >
                                    Pendientes <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded text-xs font-bold">{tickets.filter(t => t.status === 'Pendiente').length}</span>
                                </button>
                                <button
                                    onClick={() => setFilterStatus("En Progreso")}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${filterStatus === "En Progreso" ? "bg-primary/10 text-primary dark:text-white font-medium" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800"}`}
                                >
                                    En Progreso
                                </button>
                                <button
                                    onClick={() => setFilterStatus("Cerrado")}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${filterStatus === "Cerrado" ? "bg-primary/10 text-primary dark:text-white font-medium" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800"}`}
                                >
                                    Cerrados
                                </button>
                            </div>
                        </div>

                        {/* Tickets List */}
                        <div className="flex-1 bg-white dark:bg-card-dark rounded-xl shadow-soft border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-[#D62C5E]/10 dark:bg-[#D62C5E]/20 border-b border-[#D62C5E]/20 dark:border-[#D62C5E]/30">
                                            <th className="p-5 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Asunto</th>
                                            <th className="p-5 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Solicitante</th>
                                            <th className="p-5 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Propiedad</th>
                                            <th className="p-5 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Asignado a</th>
                                            <th className="p-5 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Prioridad</th>
                                            <th className="p-5 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Estado</th>
                                            <th className="p-5 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider text-right">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {filteredTickets.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="py-8 text-center text-gray-400">No hay tickets en esta categoría.</td>
                                            </tr>
                                        ) : (
                                            filteredTickets.map((ticket) => (
                                                <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                                    <td className="py-4 px-6">
                                                        <p className="font-bold text-sm text-gray-800 dark:text-white">{ticket.title}</p>
                                                        <p className="text-xs text-gray-400">#{ticket.id} • {ticket.date}</p>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <p className="text-sm font-medium dark:text-gray-200">{ticket.requester}</p>
                                                        <p className="text-xs text-blue-500">{ticket.requesterRole}</p>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <p className="text-sm font-medium dark:text-gray-200">{ticket.propertyName || 'N/A'}</p>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        {ticket.assigned_to ? (
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                                                    <span className="material-icons-round text-xs text-purple-600 dark:text-purple-400">person</span>
                                                                </div>
                                                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                                                    {users.find(u => String(u.id) === String(ticket.assigned_to))?.name || 'Cargando...'}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-gray-400 italic">Sin asignar</span>
                                                        )}
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <select
                                                            value={ticket.priority || 'Media'}
                                                            onClick={(e) => e.stopPropagation()}
                                                            onChange={(e) => updateTicketPriority(ticket.id, e.target.value as any)}
                                                            className={`text-xs font-bold rounded-md px-3 py-1.5 border cursor-pointer transition-all ${ticket.priority === 'Alta'
                                                                ? 'bg-[#D62C5E]/10 text-[#D62C5E] border-[#D62C5E]/30 dark:bg-[#D62C5E]/20 dark:border-[#D62C5E]/40'
                                                                : ticket.priority === 'Media'
                                                                    ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800/30'
                                                                    : 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:border-gray-600'
                                                                } focus:outline-none focus:ring-2 focus:ring-[#D62C5E]/30`}
                                                        >
                                                            <option value="Baja">Baja</option>
                                                            <option value="Media">Media</option>
                                                            <option value="Alta">Alta</option>
                                                        </select>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${ticket.status === 'Pendiente' ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/10 dark:text-red-400 dark:border-red-900/30' :
                                                            ticket.status === 'En Progreso' ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/10 dark:text-blue-400 dark:border-blue-900/30' :
                                                                'bg-gray-50 text-gray-600 border-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                                                            }`}>
                                                            {ticket.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 text-right">
                                                        <button
                                                            onClick={() => setSelectedTicket(ticket)}
                                                            className="text-gray-400 hover:text-primary transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800"
                                                            title="Ver Detalles"
                                                        >
                                                            <span className="material-icons-round">visibility</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : (
                    // --- Financial Approvals TabContent ---
                    <div className="bg-white dark:bg-card-dark rounded-xl shadow-soft border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#D62C5E]/10 dark:bg-[#D62C5E]/20 border-b border-[#D62C5E]/20 dark:border-[#D62C5E]/30">
                                        <th className="p-5 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Solicitud Técnica / Financiera</th>
                                        <th className="p-5 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Inmueble / Solicitante</th>
                                        <th className="p-5 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Costo Estimado</th>
                                        <th className="p-5 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Estado de Aprobación</th>
                                        <th className="p-5 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider text-right">
                                            <button
                                                onClick={() => setShowFinanceModal(true)}
                                                className="bg-primary hover:bg-primary-dark text-white px-3 py-1 rounded text-xs font-bold transition-colors"
                                            >
                                                + Nueva
                                            </button>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {financeRequests.sort((a, b) => b.id - a.id).map((req) => {
                                        const prop = properties.find(p => String(p.id) === String(req.propertyId));
                                        return (
                                            <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="py-4 px-6">
                                                    <p className="font-bold text-sm text-gray-800 dark:text-white">{req.title}</p>
                                                    <p className="text-xs text-gray-400">{req.date}</p>
                                                </td>
                                                <td className="py-4 px-6">
                                                    {prop && <p className="font-bold text-xs text-primary mb-1">{prop.name}</p>}
                                                    <p className="text-sm font-medium dark:text-gray-200">{req.requester}</p>
                                                </td>
                                                <td className="py-4 px-6 text-sm font-bold text-gray-700 dark:text-gray-300">
                                                    {formatCurrency(Number(req.cost))}
                                                </td>
                                                <td className="py-4 px-6">
                                                    {req.status === 'Pendiente' && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                                                            <span className="material-icons-round text-[14px]">hourglass_empty</span> Pendiente
                                                        </span>
                                                    )}
                                                    {req.status === 'Aprobado' && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                                            <span className="material-icons-round text-[14px]">check_circle</span> Aprobado
                                                        </span>
                                                    )}
                                                    {req.status === 'Rechazado' && (
                                                        <div className="flex flex-col items-start">
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                                                                <span className="material-icons-round text-[14px]">cancel</span> Rechazado
                                                            </span>
                                                            {req.rejectionReason && (
                                                                <span className="text-[10px] text-red-500 mt-1 max-w-xs italic">
                                                                    "{req.rejectionReason}"
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedFinanceRequest(req);
                                                            setShowFinanceModal(true);
                                                        }}
                                                        className="text-gray-400 hover:text-primary transition-colors"
                                                    >
                                                        <span className="material-icons-round">visibility</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {showFinanceModal && (
                            <AdminFinanceRequestModal
                                onClose={() => {
                                    setShowFinanceModal(false);
                                    setSelectedFinanceRequest(null);
                                }}
                                request={selectedFinanceRequest}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Calendar Page (Admin) ---
export const AdminCalendar: React.FC = () => {
    const { visits, properties, addVisit, updateVisit, deleteVisit, user, users } = useStore(); // Added deleteVisit
    const { showToast } = useToast();

    // Permission Check
    if (user?.role === 'Colaborador' && !user.permissions?.includes('calendario')) {
        return <div className="flex items-center justify-center h-full text-gray-400 font-medium">No tienes permiso para acceder al Calendario.</div>;
    }

    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVisit, setEditingVisit] = useState<any>(null); // For viewing/editing existing

    // Form State for New Visit
    const [newVisitData, setNewVisitData] = useState({
        propertyId: '',
        visitorName: '',
        advisor: '', // Nuevo campo
        time: '09:00',
        status: 'Programada' as 'Programada' | 'Realizada' | 'Cancelada' | 'Reprogramada', // Nuevo campo
        feedback: ''
    });

    // ✅ FIX: Filtrar visitas por asesor para Colaboradores
    const visibleVisits = user?.role === 'Colaborador'
        ? visits.filter(v => v.advisor === user.name || v.advisor === user.email)
        : visits;

    // Map visits to calendar events
    const events = visibleVisits.map(v => ({
        id: v.id,
        title: `${v.propertyName.split('#')[0]}... - ${v.visitorName}`,
        date: new Date(v.date), // Ensure it is a Date object
        color: v.status === 'Realizada' ? 'green' : v.status === 'Cancelada' ? 'red' : v.status === 'Reprogramada' ? 'purple' : 'blue'
    }));

    const handleDateClick = (date: Date) => {
        setSelectedDate(date);
        setNewVisitData({ propertyId: '', visitorName: '', advisor: user?.name || '', time: '09:00', status: 'Programada', feedback: '' }); // Reset time
        setEditingVisit(null);
        setIsModalOpen(true);
    };

    const handleEventClick = (id: any) => {
        const visit = visits.find(v => String(v.id) === String(id));
        if (visit) {
            setEditingVisit(visit);
            const visitDate = new Date(visit.date); // Ensure it's a Date object
            setSelectedDate(visitDate); // Fix: Set selectedDate so the date input is populated

            setNewVisitData({
                propertyId: visit.propertyId.toString(),
                visitorName: visit.visitorName,
                advisor: visit.advisor || '',
                time: visitDate.toTimeString().substring(0, 5),
                status: visit.status,
                feedback: visit.feedback || ''
            });
            setIsModalOpen(true);
        }
    };

    const addToGoogleCalendar = (visit: any) => {
        const startTime = visit.date.toISOString().replace(/-|:|\.\d\d\d/g, "");
        const endTime = new Date(new Date(visit.date).getTime() + 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, ""); // Assume 1 hour
        const details = `Inmueble: ${visit.propertyName}\nCliente: ${visit.visitorName}\nAsesor: ${visit.advisor || 'N/A'}`;
        const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Visita: ${visit.propertyName}`)}&dates=${startTime}/${endTime}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(visit.propertyName)}`;
        window.open(url, '_blank');
    };

    const handleSaveVisit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (editingVisit) {
            // Calculate new date if changed
            let finalDate = editingVisit.date;
            if (selectedDate) {
                const [hours, minutes] = newVisitData.time.split(':').map(Number);
                finalDate = new Date(selectedDate);
                finalDate.setHours(hours, minutes);
            } else {
                // Even if date didn't change via picker, time might have
                const [hours, minutes] = newVisitData.time.split(':').map(Number);
                finalDate = new Date(editingVisit.date);
                finalDate.setHours(hours, minutes);
            }

            updateVisit(editingVisit.id, {
                feedback: newVisitData.feedback,
                status: newVisitData.status,
                advisor: newVisitData.advisor,
                visitorName: newVisitData.visitorName,
                propertyId: newVisitData.propertyId,
                date: finalDate
            });
            setIsModalOpen(false); // optimistic close for update

        } else if (selectedDate) {
            // Create New
            const prop = properties.find(p => String(p.id) === String(newVisitData.propertyId));
            if (!prop) { showToast("Seleccione una propiedad", "error"); return; }

            const [hours, minutes] = newVisitData.time.split(':').map(Number);
            const visitDate = new Date(selectedDate);
            visitDate.setHours(hours, minutes);

            const result = await addVisit({
                propertyId: prop.id,
                propertyName: prop.name,
                visitorName: newVisitData.visitorName,
                advisor: newVisitData.advisor,
                date: visitDate,
                status: newVisitData.status,
                feedback: newVisitData.feedback
            });

            if (result.success) {
                showToast("Visita agendada exitosamente.", "success");
                setIsModalOpen(false);
            } else {
                showToast(result.message, "error");
            }
        }
    };

    const collaborators = users.filter(u => u.role === 'Colaborador' || u.role === 'Admin');

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
            <SectionHeader
                title="Calendario de Visitas"
                subtitle="Programación de visitas y eventos"
                action={
                    <button onClick={() => { setSelectedDate(new Date()); setIsModalOpen(true); }} className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md flex items-center gap-2">
                        <span className="material-icons-round">add</span> Agendar Visita
                    </button>
                }
            />

            <div className="flex-1 overflow-auto p-6 md:p-8">
                <Calendar
                    events={events}
                    onDateClick={handleDateClick}
                    onEventClick={handleEventClick}
                />
            </div>

            {isModalOpen && (
                <Modal
                    title={editingVisit ? "Detalles de Visita" : "Agendar Nueva Visita"}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    size="lg"
                >
                    <form onSubmit={handleSaveVisit} className="space-y-4">
                        {/* Fields for both Create and Edit */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha</label>
                                {editingVisit ? (
                                    <input
                                        type="date"
                                        value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
                                        onChange={(e) => {
                                            const newDate = new Date(e.target.value);
                                            // Preserve time from current state or default 09:00
                                            const [hours, minutes] = newVisitData.time.split(':').map(Number);
                                            newDate.setHours(hours, minutes);
                                            // Trick: We need to update selectedDate to reflect in UI immediately? 
                                            // Actually selectedDate drives the form if we use it directly.
                                            // Let's rely on handleDateClick logic BUT for direct edit we might need to adjust.
                                            // Simpler: Just update state.

                                            // Adjust for timezone offset to avoid previous day issue
                                            const timezoneOffset = newDate.getTimezoneOffset() * 60000;
                                            const adjustedDate = new Date(newDate.getTime() + timezoneOffset);
                                            adjustedDate.setHours(hours, minutes); // Set time again just in case

                                            setSelectedDate(adjustedDate);
                                        }}
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 text-sm"
                                    />
                                ) : (
                                    <input
                                        disabled
                                        value={selectedDate?.toLocaleDateString()}
                                        className="w-full rounded-lg border-gray-200 bg-gray-100 text-gray-500 text-sm cursor-not-allowed"
                                    />
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hora</label>
                                <input
                                    type="time"
                                    required
                                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 dark:text-white text-sm"
                                    value={newVisitData.time}
                                    onChange={e => setNewVisitData({ ...newVisitData, time: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Propiedad</label>
                            <select
                                required
                                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 dark:text-white text-sm"
                                value={newVisitData.propertyId}
                                onChange={e => setNewVisitData({ ...newVisitData, propertyId: e.target.value })}
                            >
                                <option value="">Seleccionar Inmueble...</option>
                                {properties.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre del Cliente</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 dark:text-white text-sm"
                                    placeholder="Ej: Familia Rodriguez"
                                    value={newVisitData.visitorName}
                                    onChange={e => setNewVisitData({ ...newVisitData, visitorName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Asesor Responsable</label>
                                <select
                                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 dark:text-white text-sm"
                                    value={newVisitData.advisor}
                                    onChange={e => {
                                        const val = e.target.value;
                                        setNewVisitData({ ...newVisitData, advisor: val });
                                        if (editingVisit) {
                                            updateVisit(editingVisit.id, { advisor: val });
                                        }
                                    }}
                                >
                                    <option value="">Seleccionar Asesor...</option>
                                    {collaborators.map(u => (
                                        <option key={u.id} value={u.name}>{u.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Estado del Evento</label>
                            <select
                                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 dark:text-white text-sm"
                                value={newVisitData.status}
                                onChange={e => setNewVisitData({ ...newVisitData, status: e.target.value as any })}
                            >
                                <option value="Programada">📅 Programada</option>
                                <option value="Realizada">✅ Realizada</option>
                                <option value="Cancelada">❌ Cancelada</option>
                                <option value="Reprogramada">🔄 Reprogramada</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Feedback / Notas</label>
                            <textarea
                                rows={3}
                                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 text-sm"
                                placeholder="Comentarios sobre la visita, resultados..."
                                value={newVisitData.feedback}
                                onChange={e => setNewVisitData({ ...newVisitData, feedback: e.target.value })}
                            ></textarea>
                        </div>

                        {/* Google Calendar Link - Always Visible if Date/Prop selected */}
                        <div className="flex justify-center py-2">
                            <button
                                type="button"
                                onClick={() => {
                                    // Construct a temp visit object for the helper
                                    const tempVisit = editingVisit || {
                                        date: (() => {
                                            const d = new Date(selectedDate || new Date());
                                            const [h, m] = newVisitData.time.split(':');
                                            d.setHours(Number(h), Number(m));
                                            return d;
                                        })(),
                                        propertyName: properties.find(p => String(p.id) === String(newVisitData.propertyId))?.name || 'Visita Inmueble',
                                        visitorName: newVisitData.visitorName,
                                        advisor: newVisitData.advisor
                                    };
                                    addToGoogleCalendar(tempVisit);
                                }}
                                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-bold text-sm bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors"
                            >
                                <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" alt="Google Calendar" className="w-5 h-5" />
                                Agregar a Google Calendar
                            </button>
                        </div>

                        <div className="flex justify-between gap-2 pt-2 border-t border-gray-100 dark:border-gray-700 mt-4">
                            <div>
                                {editingVisit && (
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (window.confirm("¿Estás seguro de ELIMINAR esta visita? Esta acción no se puede deshacer.")) {
                                                const res = await deleteVisit(editingVisit.id);
                                                if (res.success) setIsModalOpen(false);
                                            }
                                        }}
                                        className="text-red-500 hover:text-red-700 font-bold text-sm px-2 py-2 flex items-center gap-1"
                                    >
                                        <span className="material-icons-round text-lg">delete</span>
                                        Eliminar
                                    </button>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-500 hover:text-gray-700 font-bold text-sm">Cancelar</button>
                                <button type="submit" className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-bold text-sm shadow-md">
                                    {editingVisit ? "Guardar Cambios" : "Agendar Visita"}
                                </button>
                            </div>
                        </div>
                    </form>
                </Modal>
            )}
        </div >
    );
};

// --- Settings Page (Admin) ---
export const AdminSettings: React.FC = () => {
    const { addUser, deleteUser, user, users, properties } = useStore();

    // Permission Check (Strict Admin Only)
    if (user?.role === 'Colaborador') {
        return <div className="flex items-center justify-center h-full text-gray-400 font-medium">Acceso Restringido: Solo Administradores.</div>;
    }

    const [activeTab, setActiveTab] = useState<'general' | 'users'>('general');
    const { showToast } = useToast();
    const [showUserModal, setShowUserModal] = useState(false);

    // User Creation State
    const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Propietario', permissions: [] as string[], propertyId: '', policyNumber: '' });

    const handleCreateUser = (e: React.FormEvent) => {
        e.preventDefault();

        addUser({
            name: newUser.name,
            email: newUser.email,
            role: newUser.role as any,
            permissions: newUser.role === 'Colaborador' ? newUser.permissions : undefined,
            policyNumber: newUser.role === 'Inquilino' ? newUser.policyNumber : undefined,
            propertyId: newUser.role === 'Inquilino' ? newUser.propertyId : undefined
        });

        setShowUserModal(false);
        setNewUser({ name: '', email: '', role: 'Propietario', permissions: [] as string[], propertyId: '', policyNumber: '' });
    };

    const togglePermission = (perm: string) => {
        setNewUser(prev => ({
            ...prev,
            permissions: prev.permissions.includes(perm)
                ? prev.permissions.filter(p => p !== perm)
                : [...prev.permissions, perm]
        }));
    };

    const handleSave = () => showToast("Configuración guardada exitosamente.", "success");

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
            <SectionHeader title="Configuración" subtitle="Parámetros generales y gestión de usuarios" />

            {/* User Creation Modal */}
            {showUserModal && (
                <Modal title="Crear Nuevo Usuario" isOpen={showUserModal} onClose={() => setShowUserModal(false)}>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Completo</label>
                            <input required type="text" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 text-sm" placeholder="Ej: Roberto Gómez" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Correo Electrónico</label>
                            <input required type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 text-sm" placeholder="correo@ejemplo.com" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Rol de Usuario</label>
                            <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 text-sm">
                                <option value="Propietario">Propietario (Owner)</option>
                                <option value="Inquilino">Inquilino (Tenant)</option>
                                <option value="Colaborador">Colaborador (Collaborator)</option>
                            </select>
                        </div>
                        {newUser.role === 'Colaborador' && (
                            <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Permisos de Acceso</label>
                                <div className="space-y-2">
                                    {['tickets', 'calendario', 'documentos', 'propiedades'].map(perm => (
                                        <label key={perm} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={newUser.permissions.includes(perm)}
                                                onChange={() => togglePermission(perm)}
                                                className="rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                            <span className="text-sm dark:text-gray-300 capitalize">{perm}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {newUser.role === 'Inquilino' && (
                            <div className="space-y-4 bg-gray-50 dark:bg-slate-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Propiedad Asignada</label>
                                    <select
                                        required
                                        value={newUser.propertyId}
                                        onChange={e => setNewUser({ ...newUser, propertyId: e.target.value })}
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 text-sm"
                                    >
                                        <option value="">Seleccionar propiedad...</option>
                                        {properties?.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Número de Solicitud</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Ej: POL-123456"
                                        value={newUser.policyNumber}
                                        onChange={e => setNewUser({ ...newUser, policyNumber: e.target.value })}
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 text-sm"
                                    />
                                </div>
                            </div>
                        )}
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-xs text-blue-800 dark:text-blue-300">
                            <p>Al crear el usuario, se enviará automáticamente un enlace para configurar su contraseña.</p>
                        </div>
                        <button type="submit" className="w-full bg-primary hover:bg-primary-dark text-white py-2.5 rounded-lg font-bold text-sm shadow-md">Crear Usuario</button>
                    </form>
                </Modal>
            )}

            <div className="flex-1 overflow-auto p-6 md:p-10 max-w-5xl">
                {/* Tabs */}
                <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`pb-3 px-2 text-sm font-bold transition-colors relative ${activeTab === 'general' ? 'text-primary dark:text-white' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        General
                        {activeTab === 'general' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></span>}
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`pb-3 px-2 text-sm font-bold transition-colors relative ${activeTab === 'users' ? 'text-primary dark:text-white' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Gestión de Usuarios
                        {activeTab === 'users' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></span>}
                    </button>
                </div>

                {/* Content */}
                <div className="bg-white dark:bg-card-dark rounded-xl shadow-soft border border-gray-100 dark:border-gray-700 overflow-hidden">
                    {activeTab === 'general' ? (
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            <div className="p-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Perfil de Empresa</h3>
                                <p className="text-sm text-gray-500 mb-6">Información visible para inquilinos y propietarios.</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre Comercial</label>
                                        <input type="text" defaultValue="Inmobiliaria CGBI" className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-slate-800 text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email de Contacto</label>
                                        <input type="email" defaultValue="admin@cgbi.com" className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-slate-800 text-sm" />
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">Notificaciones por Email</h3>
                                    <p className="text-sm text-gray-500">Recibir alertas cuando se creen nuevos tickets.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" defaultChecked />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                                </label>
                            </div>
                            <div className="p-6">
                                <button onClick={handleSave} className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-bold text-sm shadow-md transition-all">Guardar Cambios</button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Usuarios del Sistema</h3>
                                    <p className="text-sm text-gray-500">Administra, elimina o resetea usuarios problemáticos.</p>
                                </div>
                                <button onClick={() => setShowUserModal(true)} className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md">
                                    <span className="material-icons-round">person_add</span> Nuevo Usuario
                                </button>
                            </div>

                            <UserManagementTable users={users} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Subcomponent for User Management to keep things clean
const UserManagementTable: React.FC<{ users: any[] }> = ({ users }) => {
    const { deleteUser, updateProfile } = useStore(); // Access deleteUser AND updateProfile
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [processingId, setProcessingId] = useState<string | number | null>(null);

    // Permission Editing State
    const [editingUser, setEditingUser] = useState<any>(null); // The user being edited
    const [tempPermissions, setTempPermissions] = useState<string[]>([]);

    const filtered = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDelete = async (id: string | number, name: string) => {
        if (window.confirm(`¿Estás SEGURO de eliminar a ${name}?\nEsta acción borrará todo acceso del usuario.`)) {
            setProcessingId(id);
            const res = await deleteUser(id);
            setProcessingId(null);

            if (res.success) {
                showToast("Usuario eliminado correctamente.", "success");
            } else {
                showToast(`Error: ${res.message}`, "error");
            }
        }
    };

    const handleResetPassword = async (id: string | number) => {
        if (window.confirm(`¿Resetear contraseña a 'CGBI2026!'?`)) {
            setProcessingId(id);
            try {
                // Dynamic import to avoid SSR issues if any, though likely client side
                const { supabase } = await import('../../lib/supabaseClient');
                const { data, error } = await supabase.functions.invoke('manage-users', {
                    body: { action: 'reset_password', userId: id }
                });

                if (error) throw error;
                showToast("Contraseña restablecida a CGBI2026!", "success");
            } catch (err: any) {
                showToast("Error al resetear clave: " + err.message, "error");
            } finally {
                setProcessingId(null);
            }
        }
    }

    const openEditPermissions = (user: any) => {
        setEditingUser(user);
        setTempPermissions(user.permissions || []);
    };

    const savePermissions = async () => {
        if (!editingUser) return;
        setProcessingId(editingUser.id);

        await updateProfile(editingUser.id, { permissions: tempPermissions });

        setProcessingId(null);
        setEditingUser(null);
        // Toast is handled in updateProfile, but we can add one here if needed? updateProfile handles it.
    };

    const toggleTempPermission = (perm: string) => {
        setTempPermissions(prev =>
            prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
        );
    };

    return (
        <div className="space-y-4">
            <div className="relative">
                <span className="material-icons-round absolute left-3 top-2.5 text-gray-400 text-sm">search</span>
                <input
                    type="text"
                    placeholder="Buscar por nombre o correo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-50 dark:bg-slate-800 border-none text-sm focus:ring-1 focus:ring-primary dark:text-white"
                />
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-gray-700">
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase">Usuario</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase">Rol</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {filtered.length === 0 ? (
                            <tr><td colSpan={3} className="text-center p-4 text-gray-500">No se encontraron usuarios.</td></tr>
                        ) : filtered.map(u => (
                            <tr key={u.id} className="group hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs uppercase">
                                            {u.name.substring(0, 2)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-gray-900 dark:text-white">{u.name}</p>
                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                <span className="material-icons-round text-[10px]">email</span>
                                                {u.email}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${u.role === 'Admin' ? 'bg-red-100 text-red-700' :
                                        u.role === 'Propietario' ? 'bg-purple-100 text-purple-700' :
                                            'bg-blue-100 text-blue-700'
                                        }`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        {u.role === 'Colaborador' && (
                                            <button
                                                onClick={() => openEditPermissions(u)}
                                                className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                                                title="Editar Permisos"
                                            >
                                                <span className="material-icons-round text-lg">vpn_key</span>
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleResetPassword(u.id)}
                                            disabled={!!processingId}
                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                            title="Resetear Contraseña"
                                        >
                                            <span className="material-icons-round text-lg">lock_reset</span>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(u.id, u.name)}
                                            disabled={!!processingId}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                            title="Eliminar Usuario"
                                        >
                                            <span className="material-icons-round text-lg">delete</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Permission Edit Modal */}
            {editingUser && (
                <Modal title={`Permisos: ${editingUser.name}`} isOpen={!!editingUser} onClose={() => setEditingUser(null)}>
                    <div className="space-y-4">
                        <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Acceso a Módulos</label>
                            <div className="space-y-2">
                                {['tickets', 'calendario', 'documentos', 'propiedades'].map(perm => (
                                    <label key={perm} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={tempPermissions.includes(perm)}
                                            onChange={() => toggleTempPermission(perm)}
                                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm dark:text-gray-300 capitalize font-medium">{perm}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => setEditingUser(null)} className="px-4 py-2 text-gray-500 font-bold text-sm">Cancelar</button>
                            <button
                                onClick={savePermissions}
                                className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-bold text-sm shadow-md"
                            >
                                Guardar Permisos
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};