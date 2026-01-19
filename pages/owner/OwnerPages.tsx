import React, { useState } from 'react';
import { ThemeToggle, NotificationButton } from '../../components/Layout';
import { useStore } from '../../context/StoreContext';
import { Calendar } from '../../components/Calendar';
import { Modal } from '../../components/Modal';
import { HeaderProfile } from '../../components/HeaderProfile';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils';

const OwnerHeader: React.FC<{ title: string }> = ({ title }) => (
    <header className="h-16 shrink-0 bg-card-light dark:bg-card-dark shadow-sm flex items-center justify-between px-6 z-10 border-b border-gray-100 dark:border-gray-700">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h2>
        <div className="flex items-center gap-2">
            <NotificationButton />
            <ThemeToggle />
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
            <HeaderProfile />
        </div>
    </header>
);

// --- Dashboard ---
export const OwnerDashboard: React.FC = () => {
    const { user, documents, payments, properties, financeRequests } = useStore();
    const { showToast } = useToast();

    // Filter documents
    const myDocs = documents.filter(d =>
        d.sharedWith === 'Todos' ||
        d.sharedWith === user?.name ||
        d.sharedWithId === user?.id ||
        d.owner === user?.name ||
        d.target === 'Todos' ||
        d.target === 'Propietarios' ||
        d.target === 'Owner' ||
        d.target === 'All'
    );

    // Find active contract
    const myContract = myDocs.find(d => d.name.toLowerCase().includes('contrato') || d.type.toLowerCase().includes('contrato'));

    // Derived Income (Payments for my properties)
    // Assuming 'properties' in store contains only my properties due to RLS or we filter by owner_id if available.
    // Given the context doesn't expose owner_id in property object locally without check, let's assume properties list is correct.
    const myPropertyIds = properties.map(p => p.id);
    const myIncome = payments.filter(p => myPropertyIds.includes(p.property_id || -1) && p.status === 1)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Derived Expenses (Approved Finance Requests)
    // Filter by my properties
    const myExpenses = financeRequests.filter(r => r.status === 'Aprobado' && r.propertyId && myPropertyIds.includes(r.propertyId))
        .sort((a, b) => new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime());

    return (
        <>
            <OwnerHeader title="Panel de Propietario" />
            <div className="flex-1 overflow-y-auto p-6 md:p-8 scroll-smooth">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Welcome & Contract Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Welcome / News Feed */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex flex-col gap-1">
                                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                                    {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                                <h1 className="text-2xl font-bold dark:text-white">Bienvenido, {user?.name?.split(' ')[0] || 'Propietario'}</h1>
                            </div>

                            {/* News Feed */}
                            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-2xl p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="material-icons-round text-primary dark:text-blue-400">notifications_active</span>
                                    <h3 className="font-bold text-lg text-primary dark:text-blue-200">Buzón de Novedades</h3>
                                </div>
                                <div className="space-y-3">
                                    {myDocs.slice(0, 5).length > 0 ? (
                                        myDocs.slice(0, 5).map(doc => (
                                            <div key={doc.id} className="flex gap-3 items-start bg-white/60 dark:bg-card-dark/60 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30 shadow-sm">
                                                <span className="material-icons-round text-primary text-sm mt-0.5">description</span>
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-slate-800 dark:text-white">{doc.name}</p>
                                                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                                                        {doc.date} • {doc.type}
                                                    </p>
                                                </div>
                                                <a href={doc.fileUrl || '#'} target="_blank" rel="noreferrer" className="text-primary hover:text-primary-dark">
                                                    <span className="material-icons-round text-sm">open_in_new</span>
                                                </a>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No hay novedades recientes.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Contract Card */}
                        <div className="bg-gradient-to-r from-primary to-slate-800 rounded-2xl p-6 text-white shadow-lg flex flex-col justify-between gap-6 relative overflow-hidden h-full min-h-[200px]">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <span className="material-icons-round text-9xl">gavel</span>
                            </div>
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10">
                                    <span className="material-icons-round text-3xl">gavel</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Contrato de Administración</h3>
                                    <p className="text-slate-300 text-sm">
                                        {myContract ? `Ref: ${myContract.name}` : 'No hay contrato activo'}
                                    </p>
                                </div>
                            </div>
                            {myContract ? (
                                <button onClick={() => window.open(myContract.fileUrl, '_blank')} className="bg-white text-primary hover:bg-slate-50 px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-colors flex items-center gap-2 relative z-10 w-fit">
                                    <span className="material-icons-round text-lg">download</span> Descargar Copia
                                </button>
                            ) : (
                                <button disabled className="bg-white/20 text-white/50 px-6 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 relative z-10 w-fit cursor-not-allowed">
                                    <span className="material-icons-round text-lg">block</span> No disponible
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Consignaciones (Ingresos) */}
                        <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col h-96">
                            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                <h3 className="font-bold flex items-center gap-2 dark:text-white">
                                    <span className="material-icons-round text-emerald-500">payments</span>
                                    Consignaciones CGBI
                                </h3>
                            </div>
                            <div className="flex-1 overflow-auto p-0">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 dark:bg-slate-800 sticky top-0">
                                        <tr>
                                            <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                                            <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Monto</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {myIncome.length === 0 ? (
                                            <tr>
                                                <td colSpan={2} className="px-5 py-8 text-center text-gray-500 text-sm">No hay consignaciones registradas.</td>
                                            </tr>
                                        ) : (
                                            myIncome.map((payment) => (
                                                <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                                    <td className="px-5 py-3 text-sm dark:text-white">
                                                        <p className="font-bold">{new Date(payment.date).toLocaleDateString()}</p>
                                                        <p className="text-xs text-gray-400">{payment.period}</p>
                                                    </td>
                                                    <td className="px-5 py-3 text-sm font-bold text-right text-emerald-600">+{formatCurrency(payment.amount)}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Facturas (Egresos) */}
                        <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col h-96">
                            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                <h3 className="font-bold flex items-center gap-2 dark:text-white">
                                    <span className="material-icons-round text-accent">receipt_long</span>
                                    Facturas y Egresos
                                </h3>
                                <button className="text-xs font-bold text-primary hover:underline">Ver Todo</button>
                            </div>
                            <div className="flex-1 overflow-auto p-0">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 dark:bg-slate-800 sticky top-0">
                                        <tr>
                                            <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Concepto</th>
                                            <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Monto</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {myExpenses.length === 0 ? (
                                            <tr>
                                                <td colSpan={2} className="px-5 py-8 text-center text-gray-500 text-sm">No hay egresos registrados.</td>
                                            </tr>
                                        ) : (
                                            myExpenses.map((exp) => (
                                                <tr key={exp.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                                    <td className="px-5 py-3 text-sm dark:text-white">
                                                        <p className="font-bold">{exp.title}</p>
                                                        <p className="text-xs text-gray-500">{exp.description?.substring(0, 20)}...</p>
                                                    </td>
                                                    <td className="px-5 py-3 text-sm font-bold text-right text-gray-600 dark:text-gray-300">-{formatCurrency(exp.cost || 0)}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

// --- Properties ---
export const OwnerProperties: React.FC = () => {
    const [selectedProp, setSelectedProp] = useState<any | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    const { showToast } = useToast();
    const { properties, payments } = useStore(); // Get properties and payments from store

    // Derived history for selected property
    const propertyHistory = selectedProp
        ? payments.filter(p => p.property_id === selectedProp.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        : [];

    const handleClose = () => {
        setSelectedProp(null);
        setShowHistory(false);
    };

    return (
        <>
            <OwnerHeader title="Mis Propiedades" />

            {selectedProp && (
                <Modal title={showHistory ? `Historial de Pagos - ${selectedProp.name}` : "Detalles de Propiedad"} onClose={handleClose}>
                    {!showHistory ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-left-4">
                            <img src={selectedProp.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuD10TQxMfGFcHP_zLh8YYGneAhnQxfNLDU_67tmxPPtMUpVKruLldIk-MDb5izJyBA01GSCEUErPs9SIFLVodOErEZyGNThMIL6z4T0RgG43PbHwx0yClvFZcfDXRDfBKQYw0Ao4WNCwwiNikDZ45s3obHR9DQM-LgnvSksTe3yZuyZROcl8gzn5F0-zvE_8oFnCmy5rSIJBqLxX1SXG_By2thGjCyBG_WWtW9ZJx4d8MQ7_g5bPNA3qPO8VhEIOt2aFih0KPhbDwG9"} className="w-full h-40 object-cover rounded-lg mb-2" alt="Propiedad" />
                            <div>
                                <h4 className="font-bold text-lg dark:text-white">{selectedProp.name}</h4>
                                <p className="text-sm text-gray-500">{selectedProp.address}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded-lg">
                                    <span className="block text-gray-400 text-xs uppercase">Inquilino Actual</span>
                                    <span className="font-semibold dark:text-white">{selectedProp.status === 'Ocupado' ? 'Ocupado' : 'Sin Asignar'}</span>
                                </div>
                                <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded-lg">
                                    <span className="block text-gray-400 text-xs uppercase">Contrato Hasta</span>
                                    <span className="font-semibold dark:text-white">Dic 2026</span>
                                </div>
                            </div>
                            <button onClick={() => setShowHistory(true)} className="w-full bg-primary hover:bg-primary-dark text-white py-2 rounded-lg font-bold text-sm mt-2 transition-colors">Ver Historial de Pagos</button>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                            <button onClick={() => setShowHistory(false)} className="text-sm text-gray-500 hover:text-primary flex items-center gap-1 mb-2 font-medium">
                                <span className="material-icons-round text-base">arrow_back</span> Volver a detalles
                            </button>
                            <div className="border rounded-xl overflow-hidden border-gray-100 dark:border-gray-700">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 dark:bg-slate-800">
                                        <tr>
                                            <th className="p-3 font-semibold text-gray-600 dark:text-gray-300">Fecha / Periodo</th>
                                            <th className="p-3 font-semibold text-gray-600 dark:text-gray-300">Concepto</th>
                                            <th className="p-3 font-semibold text-right text-gray-600 dark:text-gray-300">Monto</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-slate-900">
                                        {propertyHistory.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="p-4 text-center text-gray-400">No hay pagos registrados.</td>
                                            </tr>
                                        ) : (
                                            propertyHistory.map((h) => (
                                                <tr key={h.id}>
                                                    <td className="p-3 dark:text-gray-300">
                                                        <p className="font-bold">{h.period}</p>
                                                        <span className="text-xs text-gray-400">{new Date(h.date).toLocaleDateString()}</span>
                                                    </td>
                                                    <td className="p-3 dark:text-gray-300">Renta</td>
                                                    <td className="p-3 text-right font-bold text-emerald-600">+{formatCurrency(h.amount)}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <button onClick={() => showToast("Descargando Estado de Cuenta...", "info")} className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                                <span className="material-icons-round text-lg">download</span> Descargar Estado de Cuenta
                            </button>
                        </div>
                    )}
                </Modal>
            )}

            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Filter properties for this owner (mocked as Carlos Ruiz or just all for demo) */}
                    {properties.map(p => (
                        <div key={p.id} onClick={() => setSelectedProp(p)} className="bg-card-light dark:bg-card-dark rounded-xl overflow-hidden shadow-card border border-gray-100 dark:border-gray-700 flex flex-col hover:shadow-hover transition-all group cursor-pointer">
                            <div className="h-48 bg-gray-200 dark:bg-slate-700 relative overflow-hidden">
                                <img
                                    alt="Property"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    src={p.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuD10TQxMfGFcHP_zLh8YYGneAhnQxfNLDU_67tmxPPtMUpVKruLldIk-MDb5izJyBA01GSCEUErPs9SIFLVodOErEZyGNThMIL6z4T0RgG43PbHwx0yClvFZcfDXRDfBKQYw0Ao4WNCwwiNikDZ45s3obHR9DQM-LgnvSksTe3yZuyZROcl8gzn5F0-zvE_8oFnCmy5rSIJBqLxX1SXG_By2thGjCyBG_WWtW9ZJx4d8MQ7_g5bPNA3qPO8VhEIOt2aFih0KPhbDwG9"}
                                />
                                <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold border ${p.status === 'Ocupado' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                                    {p.status}
                                </span>
                            </div>
                            <div className="p-5">
                                <h3 className="text-lg font-bold mb-1 dark:text-white">{p.name}</h3>
                                <p className="text-sm text-gray-500 mb-4">{p.address}</p>
                                <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 dark:bg-slate-800 p-3 rounded-lg">
                                    <div><span className="text-gray-400 text-xs block uppercase">Renta</span> <span className="font-semibold dark:text-gray-200">{formatCurrency(Number(p.rent))}</span></div>
                                    <div><span className="text-gray-400 text-xs block uppercase">Fin Contrato</span> <span className="font-semibold dark:text-gray-200">Dic 2026</span></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

// --- Calendar (Owner) ---
export const OwnerCalendar: React.FC = () => {
    const { visits } = useStore();
    const [selectedVisit, setSelectedVisit] = useState<any>(null);

    // Filter visits for owner properties (mocking Owner Logic: id 2 and 3)
    const myVisits = visits; // In real app filter by owner's properties

    const events = myVisits.map(v => ({
        id: v.id,
        title: v.propertyName,
        date: v.date,
        color: v.status === 'Realizada' ? 'green' : 'blue'
    }));

    const handleEventClick = (id: any) => {
        const visit = visits.find(v => v.id === id);
        if (visit) setSelectedVisit(visit);
    };

    return (
        <div className="flex flex-col h-full">
            <OwnerHeader title="Calendario de Visitas" />
            <div className="flex-1 overflow-auto p-6 md:p-8">
                <Calendar events={events} onEventClick={handleEventClick} readOnly={false} />
            </div>

            {selectedVisit && (
                <Modal title="Detalle de Visita" onClose={() => setSelectedVisit(null)}>
                    <div className="space-y-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex items-start gap-4">
                            <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-lg text-blue-600 dark:text-blue-300">
                                <span className="material-icons-round text-2xl">event</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-800 dark:text-white text-lg">{selectedVisit.propertyName}</h4>
                                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                                    {selectedVisit.date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {selectedVisit.date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Visitante</label>
                                <p className="font-semibold text-gray-800 dark:text-white">{selectedVisit.visitorName}</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Estado</label>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${selectedVisit.status === 'Realizada' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {selectedVisit.status}
                                </span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Comentarios / Feedback</label>
                            <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg border border-gray-100 dark:border-gray-700 min-h-[80px]">
                                {selectedVisit.feedback ? (
                                    <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{selectedVisit.feedback}"</p>
                                ) : (
                                    <p className="text-sm text-gray-400 italic">Sin comentarios registrados aún.</p>
                                )}
                            </div>
                        </div>

                        <button onClick={() => setSelectedVisit(null)} className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 font-bold py-2.5 rounded-lg transition-colors">
                            Cerrar
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

// --- Requests (Owner Approval + Creation) ---
export const OwnerRequests: React.FC = () => {
    // Global Store State
    const { tickets, addTicket, financeRequests, updateFinanceRequestStatus, user, properties } = useStore();
    const { showToast } = useToast();

    // Derived State: Find the first pending request FOR THIS OWNER
    const myPropertyIds = properties.map(p => p.id);
    const requestToApprove = financeRequests.find(r => r.status === 'Pendiente' && r.propertyId && myPropertyIds.includes(r.propertyId));

    // UI State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [file, setFile] = useState<File | null>(null);

    // Filter tickets for this owner
    const ownRequests = tickets.filter(t => t.requesterRole === 'Propietario');

    const handleApprove = () => {
        if (!requestToApprove) return;
        updateFinanceRequestStatus(requestToApprove.id, 'Aprobado');
        showToast("Gasto aprobado. Se ha notificado a la administración y al proveedor.", "success");
    };

    const handleReject = () => {
        if (!requestToApprove) return;
        setShowRejectModal(true);
    };

    const confirmReject = () => {
        if (!requestToApprove) return;
        if (!rejectionReason.trim()) {
            showToast("Por favor escriba una justificación.", "error");
            return;
        }
        updateFinanceRequestStatus(requestToApprove.id, 'Rechazado', rejectionReason);
        setShowRejectModal(false);
        setRejectionReason("");
        showToast("Solicitud rechazada. La administración ha sido notificada.", "info");
    };

    const handleCreateRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const form = e.target as HTMLFormElement;

            // Safe element access
            const getVal = (name: string) => (form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)?.value || '';

            const propertyId = getVal('propertyId');
            const title = getVal('title');
            const desc = getVal('desc');
            const type = getVal('type');

            if (!propertyId || !title || !desc) {
                showToast("Por favor complete todos los campos obligatorios.", "error");
                return;
            }

            let fileUrl = undefined;
            if (file) {
                // In real app, upload to Supabase Storage here
                fileUrl = URL.createObjectURL(file);
            }

            const result = await addTicket({
                title: `${type}: ${title}`,
                desc,
                propertyId: propertyId,
                priority: 'Media',
                status: 'Pendiente',
                attachment: file ? file.name : undefined,
                attachmentUrl: fileUrl,
                requester: user?.name,
                requesterRole: 'Propietario'
            });

            if (result.success) {
                setShowCreateModal(false);
                setFile(null);
                showToast("Solicitud enviada exitosamente.", "success");
            } else {
                showToast(result.message, "error");
            }
        } catch (error) {
            console.error(error);
            showToast("Error al enviar solicitud.", "error");
        }
    };


    return (
        <>
            <OwnerHeader title="Solicitudes y Aprobaciones" />

            {/* Reject Modal */}
            {showRejectModal && (
                <Modal title="Justificación de Rechazo" onClose={() => setShowRejectModal(false)}>
                    <div className="space-y-4">
                        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-900/40 flex items-start gap-3">
                            <span className="material-icons-round text-amber-600 dark:text-amber-400">warning</span>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                Al rechazar esta solicitud técnica, usted asume la responsabilidad por posibles daños consecuentes. Por favor justifique su decisión.
                            </p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Motivo del rechazo</label>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                rows={4}
                                autoFocus
                                className="w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-slate-800 text-sm p-3 focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all placeholder:text-gray-400 dark:text-white"
                                placeholder="Ej: Considero el costo muy elevado, prefiero cotizar con otro proveedor..."
                            ></textarea>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button onClick={() => setShowRejectModal(false)} className="px-4 py-2.5 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white font-bold text-sm transition-colors">Cancelar</button>
                            <button onClick={confirmReject} className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-600/30 transition-all flex items-center gap-2">
                                <span className="material-icons-round text-sm">block</span> Confirmar Rechazo
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {showCreateModal && (
                <Modal title="Nueva Solicitud a CGBI" onClose={() => setShowCreateModal(false)}>
                    <form onSubmit={handleCreateRequest} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Propiedad</label>
                                <select required name="propertyId" className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 text-sm focus:ring-primary">
                                    <option value="">Seleccione una propiedad...</option>
                                    {/* Mock filtering for owner properties */}
                                    {properties.length > 0 ? (
                                        properties.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))
                                    ) : (
                                        <option value="" disabled>No hay propiedades registradas</option>
                                    )}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo de Solicitud</label>
                                    <select name="type" className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 text-sm focus:ring-primary">
                                        <option value="Mantenimiento">Mantenimiento</option>
                                        <option value="Administrativo">Administrativo</option>
                                        <option value="PQRS / Felicitaciones">PQRS / Felicitaciones</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Asunto</label>
                                    <input name="title" required type="text" className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 text-sm focus:ring-primary" placeholder="Ej: Consulta legal..." />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción</label>
                            <textarea required name="desc" rows={4} className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 text-sm focus:ring-primary p-3" placeholder="Detalle su solicitud a la inmobiliaria..."></textarea>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Adjuntar Archivo / Foto</label>
                            <input
                                type="file"
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-primary file:text-white hover:file:bg-primary-dark cursor-pointer"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                            />
                        </div>
                        <button type="submit" className="w-full bg-primary hover:bg-primary-dark text-white py-2.5 rounded-lg font-bold text-sm shadow-md transition-all">Enviar Solicitud</button>
                    </form>
                </Modal>
            )}

            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <div className="max-w-4xl mx-auto space-y-10">

                    {/* SECTION 1: Pending Approvals (Incoming) */}
                    <section>
                        <h3 className="text-lg font-bold dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-icons-round text-yellow-500">gavel</span>
                            Pendientes de Aprobación
                        </h3>

                        {requestToApprove ? (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 rounded-xl p-4 flex items-start gap-3">
                                    <span className="material-icons-round text-yellow-600 dark:text-yellow-500">info</span>
                                    <div>
                                        <h4 className="font-bold text-yellow-800 dark:text-yellow-500 text-sm">Acción Requerida</h4>
                                        <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">Solicitudes que requieren su autorización financiera.</p>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-card-dark rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700 overflow-hidden">
                                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{requestToApprove.title}</h3>
                                                <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded border border-red-200">Urgente</span>
                                            </div>
                                            <p className="text-sm text-gray-500">{requestToApprove.requester} • {requestToApprove.date}</p>
                                        </div>
                                        <span className="text-xs text-gray-400 font-medium whitespace-nowrap">Pendiente</span>
                                    </div>
                                    <div className="p-6 bg-gray-50 dark:bg-slate-800/50 grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Diagnóstico Técnico</h4>
                                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                                                {requestToApprove.desc}
                                            </p>
                                            <a
                                                href={requestToApprove.attachmentUrl || "#"}
                                                download={requestToApprove.title}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center gap-2 text-sm text-blue-600 font-medium cursor-pointer hover:underline"
                                                onClick={(e) => {
                                                    if (!requestToApprove.attachmentUrl) {
                                                        e.preventDefault();
                                                        showToast("Descargando PDF simulado...", "info");
                                                    }
                                                }}
                                            >
                                                <span className="material-icons-round text-base">attach_file</span> Ver Cotización / Adjunto
                                            </a>
                                        </div>
                                        <div className="bg-white dark:bg-card-dark p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Presupuesto Estimado</h4>
                                            <div className="flex justify-between items-end mb-1">
                                                <span className="text-sm text-gray-600 dark:text-gray-300">Total (Materiales + Mano de Obra)</span>
                                                <span className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(Number(requestToApprove.cost))}</span>
                                            </div>
                                            <p className="text-xs text-gray-400">Este monto se deducirá de la próxima renta.</p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
                                        <button onClick={handleReject} className="px-4 py-2 bg-white dark:bg-card-dark border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-bold text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">Rechazar / Consultar</button>
                                        <button onClick={handleApprove} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-sm shadow-md transition-colors flex items-center gap-2">
                                            <span className="material-icons-round text-lg">check_circle</span> Aprobar Gasto
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-10 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                                <span className="material-icons-round text-4xl text-gray-300 dark:text-slate-600 mb-2">check_circle</span>
                                <p className="text-gray-500 dark:text-slate-400 font-medium">No tiene aprobaciones pendientes.</p>
                            </div>
                        )}
                    </section>

                    {/* SECTION 2: My Requests (Outgoing) */}
                    <section>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold dark:text-white flex items-center gap-2">
                                <span className="material-icons-round text-primary dark:text-blue-400">send</span>
                                Mis Solicitudes a CGBI
                            </h3>
                            <button onClick={() => setShowCreateModal(true)} className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md flex items-center gap-2">
                                <span className="material-icons-round text-lg">add</span> Nueva Solicitud
                            </button>
                        </div>

                        <div className="space-y-3">
                            {ownRequests.map(req => (
                                <div key={req.id} className="bg-white dark:bg-card-dark p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col hover:shadow-sm transition-shadow">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center">
                                                <span className="material-icons-round">description</span>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-800 dark:text-white text-sm">{req.title}</h4>
                                                <p className="text-xs text-gray-400">{req.date}</p>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${req.status === 'Pendiente' ? 'bg-amber-100 text-amber-700' : req.status === 'En Progreso' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {req.status}
                                        </span>
                                    </div>

                                    {/* Message History */}
                                    {req.messages && req.messages.length > 0 && (
                                        <div className="mt-2 bg-gray-50 dark:bg-slate-800/50 rounded-lg p-3 space-y-2">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Mensajes</p>
                                            {req.messages.map((msg: any) => (
                                                <div key={msg.id} className={`flex ${msg.role === 'Admin' ? 'justify-start' : 'justify-end'}`}>
                                                    <div className={`max-w-[90%] p-2 rounded-lg text-xs ${msg.role === 'Admin' ? 'bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200' : 'bg-white border border-gray-200 text-gray-700 dark:bg-slate-700 dark:text-gray-300'}`}>
                                                        <span className="font-bold opacity-75 mr-1">{msg.sender}:</span>
                                                        <span>{msg.text}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                </div>
            </div>
        </>
    );
};