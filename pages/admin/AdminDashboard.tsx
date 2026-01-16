import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle, NotificationButton } from '../../components/Layout';
import { useStore } from '../../context/StoreContext';

const RecentActivityList: React.FC = () => {
  const { documents, user } = useStore();
  const navigate = useNavigate();

  // Sort documents by date (assuming they have dates)
  // Taking top 5 recent documents
  const recentDocs = documents.slice(0, 5);

  if (recentDocs.length === 0) {
    return <div className="p-4 text-sm text-slate-500 text-center">No hay actividad reciente.</div>;
  }

  return (
    <>
      {recentDocs.map((doc, idx) => (
        <div key={idx} onClick={() => navigate('/admin/documents')} className="flex items-start gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors cursor-pointer group">
          <div className="flex-shrink-0 size-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center">
            <span className="material-icons-round text-[24px]">description</span>
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{doc.name}</p>
            <p className="text-xs text-slate-500 mt-0.5">Tipo: {doc.type} • {doc.date}</p>
          </div>
        </div>
      ))}
    </>
  );
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { properties, tickets, user } = useStore();

  // --- KPI Calculations ---
  const totalProperties = properties.length;
  // Calculate percentage growth (mock logic for now as we lack historical data) or just hide percentage if not available

  const openTickets = tickets.filter(t => t.status === 'Abierto' || t.status === 'En Progreso').length;
  const urgentTickets = tickets.filter(t => t.priority === 'Alta' && t.status !== 'Cerrado').length;
  const openTicketsPercentage = tickets.length > 0 ? (openTickets / tickets.length) * 100 : 0;


  // Let's assume 'Ocupado' or 'Alquilada' based on previous context.
  // Checking StoreContext logic, Property status can be 'Disponible', 'Alquilada', 'Vendida', 'Mantenimiento'.
  const rentedProperties = properties.filter(p => p.status === 'Arrendado').length;
  const occupancyRate = totalProperties > 0 ? Math.round((rentedProperties / totalProperties) * 100) : 0;

  /* Removed AI Summary Logic */

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-card-dark px-6 lg:px-8 z-10">
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">Panel de Control</h1>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-64 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <span className="material-icons-round text-[20px]">search</span>
              </div>
              <input className="block w-full pl-10 pr-3 py-2 border-none ring-1 ring-slate-200 dark:ring-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-card-dark transition-all" placeholder="Buscar..." type="text" />
            </div>
          </div>
          <NotificationButton />
          <ThemeToggle />
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
          <div className="flex items-center gap-3 pl-2 cursor-pointer group">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold leading-tight">{user?.name || 'Usuario'}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{user?.role || 'Rol Desconocido'}</p>
            </div>
            <div className="size-9 rounded-full bg-primary/10 text-primary dark:text-white border-2 border-white dark:border-slate-700 shadow-sm flex items-center justify-center font-bold text-sm">
              {user?.name ? user.name.substring(0, 2).toUpperCase() : 'US'}
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 lg:p-8 scroll-smooth">
        <div className="mx-auto max-w-7xl flex flex-col gap-8">



          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group relative flex flex-col gap-1 rounded-2xl bg-white dark:bg-card-dark p-6 shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Total de Inmuebles</p>
                <div className="p-2 bg-pink-50 dark:bg-pink-900/30 text-accent rounded-lg">
                  <span className="material-icons-round text-[20px]">domain</span>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold tracking-tight">{totalProperties}</h3>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                  <span className="material-icons-round text-[14px]">trending_up</span> --
                </span>
              </div>
            </div>
            <div className="group relative flex flex-col gap-1 rounded-2xl bg-white dark:bg-card-dark p-6 shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Tickets Activos</p>
                <div className="p-2 bg-pink-50 dark:bg-pink-900/30 text-accent rounded-lg">
                  <span className="material-icons-round text-[20px]">confirmation_number</span>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold tracking-tight">{openTickets}</h3>
                <span className="text-sm font-medium text-accent dark:text-pink-400 px-1">{urgentTickets} urgentes</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-accent h-full rounded-full" style={{ width: `${openTicketsPercentage}%` }}></div>
              </div>
            </div>
            <div className="group relative flex flex-col gap-1 rounded-2xl bg-white dark:bg-card-dark p-6 shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Tasa de Ocupación</p>
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                  <span className="material-icons-round text-[20px]">vpn_key</span>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold tracking-tight">{occupancyRate}%</h3>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400">{rentedProperties} alquilados</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: `${occupancyRate}%` }}></div>
              </div>
            </div>
          </div>

          {/* Table and Activity */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 flex flex-col bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-lg">Estado de Tickets</h3>
                <button
                  onClick={() => navigate('/admin/tickets')}
                  className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                >
                  Ver Todo
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold tracking-wider">
                      <th className="px-6 py-4">ID Ticket</th>
                      <th className="px-6 py-4">Asunto</th>
                      <th className="px-6 py-4">Propiedad</th>
                      <th className="px-6 py-4">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {tickets.slice(0, 5).map(ticket => (
                      <tr key={ticket.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium">#{ticket.id}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{ticket.title}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{ticket.propertyName || 'N/A'}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                            ${ticket.status === 'Abierto' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                              ticket.status === 'En Progreso' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' :
                                'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}`}>
                            {ticket.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {tickets.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-500">
                          No hay tickets recientes.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex flex-col bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden h-fit">
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-lg">Actividad Reciente</h3>
              </div>
              <div className="flex flex-col p-2">
                {/* Dynamically List Recent Documents as Activity */}
                {/* We need documents from store to be safe, assuming it's imported or avail via useStore */}
                <RecentActivityList />
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default AdminDashboard;