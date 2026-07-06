import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle, NotificationButton } from '../../components/Layout';
import { HeaderProfile } from '../../components/HeaderProfile';
import { useStore } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils';

// --- Shared Components ---
const TenantHeader: React.FC<{ title: string }> = ({ title }) => (
    <header className="h-16 shrink-0 bg-card-light dark:bg-card-dark border-b border-gray-100 dark:border-gray-700 flex items-center justify-between px-6 z-10 shadow-sm relative">
        <h1 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h1>
        <div className="flex items-center gap-2">
            <NotificationButton />
            <ThemeToggle />
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
            <HeaderProfile />
        </div>
    </header>
);

// --- Dashboard ---
export const TenantDashboard: React.FC = () => {
    const { user, payments, documents, properties } = useStore();
    const { showToast } = useToast();
    const navigate = useNavigate();

    // Get first name for greeting
    const firstName = user?.name ? user.name.split(' ')[0] : 'Usuario';

    const myProperty = properties.find(p => String(p.tenant_id) === String(user?.id));

    // RLS already filters documents - show all that the user is allowed to see
    // Store logic: Filter last 7 days and limit to 3
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const myDocuments = documents
        .filter(d => {
            const isForMe = d.target === 'Todos' || d.target === 'General (Todos)' || d.target === 'Inquilinos' || d.target === 'All' || d.target === 'Tenant' || d.sharedWith === 'Todos' || d.sharedWith === user?.name || d.targetId === user?.id || d.sharedWithId === user?.id;
            if (!isForMe) return false;

            // Use timestamp if available, fallback to basic parsing
            const docDate = d.timestamp ? new Date(d.timestamp) : new Date(); // fallback
            return docDate >= sevenDaysAgo;
        })
        .sort((a, b) => {
            if (a.timestamp && b.timestamp) return b.timestamp - a.timestamp;
            return (b.id as number) - (a.id as number);
        })
        .slice(0, 3);

    // Derived Payment State
    // Find earliest pending payment
    const nextPayment = payments
        .filter(p => p.status === 0 || p.status === 2) // Pending or Late
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

    const amountToShow = nextPayment ? nextPayment.amount : 0;
    const dateToShow = nextPayment
        ? new Date(nextPayment.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
        : '---';

    const recentCommunication = myDocuments.find(d => {
        if (d.type !== 'Comunicación') return false;
        const parts = d.date.split('/');
        const docDate = parts.length === 3 ? new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])).getTime() : new Date(d.date).getTime();
        return (new Date().getTime() - docDate) <= 86400000;
    });

    return (
        <>
            <TenantHeader title="Inicio" />
            <main className="flex-1 flex flex-col items-center py-8 px-4 sm:px-6 overflow-y-auto">
                <div className="w-full max-w-[640px] flex flex-col gap-8">
                    {recentCommunication && (
                        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-xl shadow-sm animate-in fade-in">
                            <div className="flex items-center gap-2">
                                <span className="material-icons-round">campaign</span>
                                <div>
                                    <p className="font-bold text-sm">Aviso Importante</p>
                                    <p className="text-sm">{recentCommunication.name}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="flex flex-col gap-1">
                        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                            {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                        <h1 className="text-2xl sm:text-3xl font-bold dark:text-white">Bienvenido, {firstName}</h1>
                    </div>

                    {/* Mi Inmueble en Arriendo Card */}
                    {myProperty ? (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col sm:flex-row gap-5 p-5 animate-in fade-in slide-in-from-top-4">
                            {myProperty.image ? (
                                <img src={myProperty.image} alt={myProperty.name} className="w-full sm:w-44 h-32 object-cover rounded-xl shrink-0 shadow-sm" />
                            ) : (
                                <div className="w-full sm:w-44 h-32 bg-[#D62C5E]/10 dark:bg-[#D62C5E]/20 rounded-xl flex items-center justify-center text-[#D62C5E] shrink-0 shadow-inner">
                                    <span className="material-icons-round text-5xl">
                                        {myProperty.type === 'Apartamento' ? 'apartment' : myProperty.type === 'Casa' ? 'house' : 'storefront'}
                                    </span>
                                </div>
                            )}
                            <div className="flex-1 flex flex-col justify-between py-1">
                                <div>
                                    <div className="flex justify-between items-start gap-2">
                                        <div>
                                            <p className="text-[10px] font-bold text-[#D62C5E] uppercase tracking-wider">Mi Inmueble en Arriendo</p>
                                            <h3 className="font-bold text-lg text-slate-800 dark:text-white leading-tight mt-0.5">{myProperty.name}</h3>
                                        </div>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D62C5E]/10 text-[#D62C5E] border border-[#D62C5E]/20">
                                            {myProperty.type}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
                                        <span className="material-icons-round text-sm">place</span>
                                        {myProperty.address}
                                    </p>
                                </div>
                                <div className="mt-4 sm:mt-0 pt-3 border-t sm:border-t-0 border-gray-100 dark:border-gray-700 flex flex-wrap justify-between items-center gap-2">
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Canon Mensual</p>
                                        <p className="text-lg font-black text-[#D62C5E]">{formatCurrency(Number(myProperty.rent))}</p>
                                    </div>
                                    {myProperty.contractEnd && (
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Vencimiento Contrato</p>
                                            <p className="text-sm font-semibold text-slate-700 dark:text-gray-300">{new Date(myProperty.contractEnd).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-6 text-center shadow-sm animate-in fade-in">
                            <span className="material-icons-round text-gray-300 dark:text-gray-600 text-4xl mb-2">home</span>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No tienes un inmueble asignado actualmente.</p>
                        </div>
                    )}

                    {/* News Feed / Documents */}
                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="material-icons-round text-primary dark:text-blue-400">notifications_active</span>
                            <h3 className="font-bold text-lg text-primary dark:text-blue-200">Últimos Documentos</h3>
                        </div>
                        <div className="space-y-3">
                            {myDocuments.length > 0 ? (
                                myDocuments.map(doc => (
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
                        {/* View All Button */}
                        <div className="mt-4 pt-3 border-t border-blue-200 dark:border-blue-800/50 text-center">
                            <button onClick={() => navigate('/tenant/contracts')} className="text-sm font-bold text-primary hover:text-primary-dark transition-colors inline-flex items-center gap-1">
                                Ver todo <span className="material-icons-round text-sm">arrow_forward</span>
                            </button>
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-card-dark shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-8 flex flex-col gap-6">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="material-icons-round text-primary text-xl">account_balance_wallet</span>
                                    <span className="text-gray-500 dark:text-gray-400 font-medium text-sm uppercase tracking-wide">
                                        Estado de Cuenta
                                    </span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl sm:text-5xl font-bold dark:text-white">
                                        {user?.financialStatus || (nextPayment ? formatCurrency(amountToShow) : "Al día")}
                                    </span>
                                </div>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 font-medium">
                                    {nextPayment ? `Vence el ${dateToShow}` : 'Estado de cuenta actualizado'}
                                </p>
                            </div>
                            <div className={`
                                px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider self-start sm:self-center
                                ${user?.financialStatus === 'En Mora' || (nextPayment && nextPayment.status === 2)
                                    ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                                    : user?.financialStatus === 'Pendiente de Pago' || (nextPayment && nextPayment.status === 0)
                                        ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'
                                        : 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                                }
                            `}>
                                {user?.financialStatus || (nextPayment ? (nextPayment.status === 2 ? 'En Mora' : 'Pendiente') : 'Paz y Salvo')}
                            </div>
                        </div>
                        <button onClick={() => window.open('https://checkout.wompi.co/l/VPOS_jEk4cb', '_blank')} className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2">
                            <span className="material-icons-round">payments</span> Pagar Ahora
                        </button>
                    </div>
                </div>
            </main>
        </>
    );
};

// --- Payments ---
export const TenantPayments: React.FC = () => {
    const { showToast } = useToast();
    const { payments, user } = useStore();

    // Filter payments for the current tenant
    const myPayments = payments.filter(p => p.tenant_id === user?.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const handleDownload = (docName: string) => {
        if (window.confirm(`¿Desea descargar "${docName}"?`)) {
            showToast("Descarga iniciada...", "info");
        }
    };
    return (
        <>
            <TenantHeader title="Pagos y Facturas" />
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="bg-card-light dark:bg-card-dark rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700 overflow-hidden mb-8">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-slate-800">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Periodo</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Monto</th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {myPayments.length > 0 ? (
                                    myPayments.map((pay) => (
                                        <tr key={pay.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                            <td className="px-6 py-4 text-sm font-medium dark:text-white">{pay.period}</td>
                                            <td className={`px-6 py-4 text-sm font-bold ${pay.status === 1 || pay.status === 'Pagado' ? 'text-emerald-600' : 'text-amber-500'}`}>
                                                {pay.status === 1 || pay.status === 'Pagado' ? 'Pagado' : 'Pendiente'}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-right dark:text-white">{formatCurrency(pay.amount)}</td>
                                            <td className="px-6 py-4 text-right">
                                                {(pay.status === 1 || pay.status === 'Pagado') && (
                                                    pay.fileUrl ? (
                                                        <a href={pay.fileUrl} target="_blank" rel="noreferrer" className="text-primary text-xs font-bold hover:underline">Recibo</a>
                                                    ) : (
                                                        <button onClick={() => showToast("Recibo no disponible para este pago (no adjuntado).", "info")} className="text-gray-400 text-xs font-bold cursor-not-allowed">Recibo</button>
                                                    )
                                                )}
                                                {(pay.status === 0 || pay.status === 'Pendiente') && (
                                                    <button onClick={() => window.open('https://checkout.wompi.co/l/VPOS_jEk4cb', '_blank')} className="bg-primary text-white px-3 py-1 rounded text-xs font-bold hover:bg-primary-dark">Pagar</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500 text-sm">
                                            No hay historial de pagos registrado.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
};

// --- Contracts ---
export const TenantContracts: React.FC = () => {
    const { documents, user } = useStore();
    const { showToast } = useToast();

    // Apply strict filtering by UUID and role to ensure correct visibility
    const myDocuments = [...documents]
        .filter(d => 
            d.target === 'Todos' || d.target === 'General (Todos)' || d.target === 'Inquilinos' || d.target === 'All' || d.target === 'Tenant' || d.sharedWith === 'Todos' || d.sharedWith === user?.name || d.targetId === user?.id || d.sharedWithId === user?.id
        )
        .sort((a, b) => {
            if (a.timestamp && b.timestamp) return b.timestamp - a.timestamp;
            return (b.id as number) - (a.id as number);
        });

    const handleDownload = (doc: any) => {
        if (doc.fileUrl) {
            window.open(doc.fileUrl, '_blank');
        } else {
            showToast("Documento no disponible", "error");
        }
    };

    const activeContract = myDocuments.find(d => d.type === 'Contrato');

    return (
        <>
            <TenantHeader title="Documentos y Contratos" />
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="grid gap-4 max-w-3xl mx-auto">
                    {/* Active Contract Card */}
                    <div className="bg-gradient-to-br from-primary to-slate-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className="material-icons-round text-9xl">gavel</span>
                        </div>
                        <div className="relative z-10">
                            <h2 className="text-2xl font-bold mb-1">Contrato de Arrendamiento</h2>
                            {activeContract ? (
                                <>
                                    <p className="text-slate-200 mb-6 text-sm">{activeContract.name}</p>
                                    <button 
                                        onClick={() => handleDownload(activeContract)}
                                        className="px-4 py-2 bg-white text-primary hover:bg-slate-100 font-bold rounded-lg text-sm shadow-md transition-all flex items-center gap-2 w-fit"
                                    >
                                        <span className="material-icons-round text-sm">download</span> Ver Documento
                                    </button>
                                </>
                            ) : (
                                <p className="text-slate-200 mb-6 text-sm italic">No tienes un contrato registrado en el sistema.</p>
                            )}
                        </div>
                    </div>

                    {/* All Documents */}
                    <div className="bg-card-light dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
                        <h3 className="font-bold text-gray-800 dark:text-white mb-4">Historial de Documentos</h3>
                        <div className="space-y-3">
                            {myDocuments.length > 0 ? (
                                myDocuments.map(doc => (
                                    <div key={doc.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-700">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-gray-500">
                                                <span className="material-icons-round">description</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold dark:text-white">{doc.name}</p>
                                                <p className="text-xs text-gray-400">{doc.date} • {doc.type}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDownload(doc)} className="text-primary text-sm font-bold hover:underline">Ver / Descargar</button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 p-4 text-center">No hay documentos disponibles.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

// --- Requests (Tickets) ---
export const TenantRequests: React.FC = () => {
    const { tickets, addTicket, user } = useStore();
    const { showToast } = useToast();
    const [showForm, setShowForm] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    // Filter tickets for this tenant
    const myTickets = tickets
        .filter(t => t.requesterRole === 'Inquilino' && t.requester === user?.name)
        .sort((a, b) => b.id - a.id);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;

        let fileUrl = undefined;
        if (file) {
            fileUrl = URL.createObjectURL(file);
        }

        const result = await addTicket({
            title: (form.elements.namedItem('title') as HTMLInputElement).value,
            type: (form.elements.namedItem('type') as HTMLSelectElement).value as any,
            desc: (form.elements.namedItem('desc') as HTMLTextAreaElement).value,
            requester: user?.name || "Inquilino",
            requesterRole: 'Inquilino',
            priority: 'Media',
            attachment: file?.name,
            attachmentUrl: fileUrl,
            messages: []
        });

        if (result.success) {
            setShowForm(false);
            setFile(null);
            showToast("Solicitud creada exitosamente. El administrador ha sido notificado.", "success");
        } else {
            showToast(result.message, "error");
        }
    };

    return (
        <>
            <TenantHeader title="Solicitudes y Mantenimiento" />
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-3xl mx-auto">
                    {/* Header Action */}
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold dark:text-white">Mis Tickets</h2>
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-md transition-all"
                        >
                            <span className="material-icons-round">{showForm ? 'close' : 'add'}</span>
                            {showForm ? 'Cancelar' : 'Nueva Solicitud'}
                        </button>
                    </div>

                    {/* New Request Form */}
                    {showForm && (
                        <div className="mb-8 bg-card-light dark:bg-card-dark rounded-2xl p-6 shadow-soft border border-gray-100 dark:border-gray-700 animate-in slide-in-from-top-4 fade-in">
                            <form onSubmit={handleSubmit}>
                                <h3 className="font-bold text-gray-800 dark:text-white mb-4">Detalles del problema</h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo de Solicitud</label>
                                                <select name="type" className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-sm focus:ring-primary dark:text-white">
                                                    <option value="Mantenimiento">Mantenimiento</option>
                                                    <option value="Administrativo">Administrativo</option>
                                                    <option value="PQRS / Felicitaciones">PQRS / Felicitaciones</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Asunto</label>
                                                <input name="title" type="text" required className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-sm focus:ring-primary dark:text-white" placeholder="Ej: Solicitud" />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción</label>
                                        <textarea required name="desc" rows={4} className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-sm focus:ring-primary dark:text-white" placeholder="Describa el problema con detalle..."></textarea>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Adjuntar Archivo / Foto</label>
                                        <input
                                            type="file"
                                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-primary file:text-white hover:file:bg-primary-dark cursor-pointer"
                                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                                        />
                                    </div>
                                    <div className="bg-amber-50 dark:bg-yellow-900/10 border border-amber-200 dark:border-yellow-900/30 p-4 rounded-xl text-xs text-amber-800 dark:text-yellow-500 leading-relaxed flex gap-2">
                                        <span className="material-icons-round text-base shrink-0">info</span>
                                        <p>
                                            Los tiempos de respuesta dependerán de la naturaleza y prioridad de la solicitud y se atenderán dentro de los términos establecidos por la legislación colombiana vigente. En los casos que aplique, el tiempo de respuesta podrá ser de hasta 15 días hábiles, sin perjuicio de una atención más ágil cuando sea posible.
                                        </p>
                                    </div>
                                    <button type="submit" className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-lg font-bold text-sm transition-colors">Enviar Solicitud</button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Tickets List */}
                    <div className="space-y-4">
                        {myTickets.map((t) => (
                            <div key={t.id} className="bg-white dark:bg-card-dark p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex gap-4 animate-in fade-in">
                                <div className="flex-shrink-0 mt-1">
                                    <span className="material-icons-round text-orange-500 bg-orange-50 dark:bg-orange-900/20 p-2 rounded-lg">warning</span>
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-bold text-gray-900 dark:text-white">{t.title}</h4>
                                        <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded">{t.status}</span>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{t.desc}</p>
                                    {t.attachment && (
                                        <div className="mb-3">
                                            <a
                                                href={t.attachmentUrl || "#"}
                                                download={t.attachment}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                                                onClick={(e) => {
                                                    if (!t.attachmentUrl) {
                                                        e.preventDefault();
                                                        showToast("Archivo simulado no disponible para descarga (Mock).", "info");
                                                    }
                                                }}
                                            >
                                                <span className="material-icons-round text-sm">attach_file</span>
                                                {t.attachment}
                                            </a>
                                        </div>
                                    )}
                                    {t.messages && t.messages.length > 0 && (
                                        <div className="mt-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl p-3 space-y-3 mb-3">
                                            <p className="text-xs font-bold text-gray-400 uppercase">Historial de Mensajes</p>
                                            {t.messages.map((msg: any) => (
                                                <div key={msg.id} className={`flex ${msg.role === 'Admin' ? 'justify-start' : 'justify-end'}`}>
                                                    <div className={`max-w-[90%] p-2 rounded-lg text-sm ${msg.role === 'Admin' ? 'bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200' : 'bg-white border border-gray-200 text-gray-700 dark:bg-slate-700 dark:text-gray-300'}`}>
                                                        <p className="font-bold text-xs opacity-75 mb-0.5">{msg.role === 'Admin' ? 'Admin CGBI' : (msg.sender || 'Tú')}</p>
                                                        <p>{msg.text}</p>
                                                        <p className="text-[10px] opacity-60 text-right mt-1">{msg.time}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <p className="text-xs text-gray-400">Ticket #{t.id} • {t.date}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};