import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserRole } from '../types';
import { useStore } from '../context/StoreContext';
import { LOGO_BASE64 } from '../constants/logo';
import { ChangePasswordModal } from './ChangePasswordModal';

export const Logo = ({ className }: { className?: string }) => (
  <div className={`flex items-center justify-center rounded-full overflow-hidden aspect-square border border-white/20 bg-white shadow-sm ${className}`}>
    <img
      alt="CGBI Logo"
      className="object-cover h-full w-full transform hover:scale-105 transition-transform"
      src="/sikai-logo.png"
      onError={(e) => {
        const target = e.currentTarget;
        target.style.display = 'none';
        // Fallback to text if image fails
        const span = document.createElement('span');
        span.innerText = 'CGBI';
        span.className = 'font-bold text-2xl tracking-tighter text-primary dark:text-white';
        target.parentElement?.appendChild(span);
      }}
    />
  </div>
);

export const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <button
      onClick={() => {
        console.log("Toggling theme. Current:", isDark ? "Dark" : "Light");
        setIsDark(!isDark);
      }}
      className="relative z-50 p-2 rounded-full bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-gray-300 hover:text-primary dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-600 transition-all border border-gray-100 dark:border-gray-600 cursor-pointer shadow-sm"
      aria-label="Alternar Tema"
    >
      <span className="material-icons-round dark:hidden text-xl">dark_mode</span>
      <span className="material-icons-round hidden dark:block text-xl">light_mode</span>
    </button>
  );
};

export const NotificationButton = () => {
  const { requestNotificationPermission } = useStore();
  return (
    <button
      onClick={requestNotificationPermission}
      className="p-2 rounded-full bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-gray-300 hover:text-yellow-500 dark:hover:text-yellow-400 hover:bg-gray-100 dark:hover:bg-slate-600 transition-all border border-gray-100 dark:border-gray-600 group"
      title="Activar Notificaciones"
    >
      <span className="material-icons-round text-xl group-hover:animate-swing">notifications</span>
    </button>
  );
};

// --- Sidebar Link Component ---
const SidebarLink = ({ to, icon, label, isCollapsed }: { to: string; icon: string; label: string; isCollapsed: boolean }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      title={isCollapsed ? label : undefined}
      className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 cursor-pointer rounded-xl transition-all duration-200 ${isActive
        ? 'bg-secondary/10 text-secondary font-bold shadow-sm border border-secondary/20'
        : 'text-slate-400 hover:text-white hover:bg-white/5'
        }`}
    >
      <span className={`material-icons-round text-2xl ${isActive ? 'text-secondary' : 'group-hover:text-white'}`}>{icon}</span>
      {!isCollapsed && <span className="font-medium text-sm animate-in fade-in slide-in-from-left-2 duration-300">{label}</span>}
    </Link>
  );
};

interface SidebarProps {
  role: UserRole;
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ role, isOpen, onClose, isCollapsed, toggleCollapse }) => {
  const { requestNotificationPermission, user, logout } = useStore();
  const navigate = useNavigate();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    window.location.reload();
  };

  const onRequestNotifications = () => {
    requestNotificationPermission();
  };

  // Responsive sidebar classes: Fixed on mobile, Desktop dynamic width
  const baseClasses = `
    fixed inset-y-0 left-0 z-50 h-screen border-r transition-all duration-300 ease-in-out shadow-2xl lg:shadow-none
    lg:relative lg:flex lg:flex-col lg:z-0
    ${isOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'}
    ${isCollapsed ? 'lg:w-24' : 'lg:w-72'}
  `;

  // UNIFIED THEME: CGBI Navy (Primary)
  const themeClasses = "bg-primary text-white border-white/5";

  // Override collapse state on mobile (when isOpen is true, labels must show)
  const showLabels = !isCollapsed || isOpen;
  // We pass 'effectiveCollapsed' to links to control label rendering
  const effectiveCollapsed = !showLabels;

  return (
    <>
      <aside className={`${baseClasses} ${themeClasses}`}>
        <div className={`h-24 flex items-center justify-center relative border-b border-white/5 transition-all duration-300 ${effectiveCollapsed ? 'px-0' : 'px-6'}`}>

          {/* LOGO: Always Centered */}
          <div className={`transition-all duration-300 ${effectiveCollapsed ? 'w-16 h-16' : 'w-auto h-20'} flex items-center justify-center shrink-0`}>
            <Logo className="h-16 w-16 shadow-lg" />
          </div>

          {/* Desktop Collapse Button - Absolute Positioned to Right */}
          {!isCollapsed && (
            <button onClick={toggleCollapse} className="hidden lg:block absolute right-4 p-1 text-slate-400 hover:text-white transition-colors">
              <span className="material-icons-round">chevron_left</span>
            </button>
          )}

          {/* Mobile Close Button - Absolute Positioned to Right */}
          <button onClick={onClose} className="lg:hidden absolute right-4 p-1 text-white opacity-70 hover:opacity-100 rounded-md hover:bg-white/10 transition-colors">
            <span className="material-icons-round">close</span>
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-6 overflow-y-auto overflow-x-hidden">
          {/* Expand button for collapsed mode */}
          {isCollapsed && (
            <button onClick={toggleCollapse} className="hidden lg:flex w-full justify-center p-2 mb-4 text-slate-400 hover:text-white bg-white/5 rounded-lg transition-colors">
              <span className="material-icons-round">chevron_right</span>
            </button>
          )}

          {role === UserRole.ADMIN && (
            <>
              <SidebarLink to="/admin/dashboard" icon="dashboard" label="Panel General" isCollapsed={effectiveCollapsed} />

              {/* Properties Group (Properties, Tenants, Owners) */}
              {(user?.role === 'Admin' || user?.permissions?.includes('propiedades')) && (
                <>
                  <SidebarLink to="/admin/properties" icon="apartment" label="Inmuebles" isCollapsed={effectiveCollapsed} />
                  <SidebarLink to="/admin/tenants" icon="group" label="Inquilinos" isCollapsed={effectiveCollapsed} />
                </>
              )}

              {(user?.role === 'Admin' || user?.permissions?.includes('tickets')) && (
                <SidebarLink to="/admin/tickets" icon="confirmation_number" label="Tickets" isCollapsed={effectiveCollapsed} />
              )}

              {(user?.role === 'Admin' || user?.permissions?.includes('documentos')) && (
                <SidebarLink to="/admin/documents" icon="folder_shared" label="Documentos" isCollapsed={effectiveCollapsed} />
              )}

              {(user?.role === 'Admin' || user?.permissions?.includes('calendario')) && (
                <SidebarLink to="/admin/calendar" icon="event" label="Calendario" isCollapsed={effectiveCollapsed} />
              )}

              {user?.role === 'Admin' && (
                <SidebarLink to="/admin/settings" icon="settings" label="Configuración" isCollapsed={effectiveCollapsed} />
              )}
            </>
          )}

          {role === UserRole.TENANT && (
            <>
              <SidebarLink to="/tenant/dashboard" icon="dashboard" label="Inicio" isCollapsed={effectiveCollapsed} />
              <SidebarLink to="/tenant/payments" icon="receipt_long" label="Pagos y Facturas" isCollapsed={effectiveCollapsed} />
              <SidebarLink to="/tenant/contracts" icon="description" label="Mis Contratos" isCollapsed={effectiveCollapsed} />
              <SidebarLink to="/tenant/requests" icon="home_repair_service" label="Solicitudes" isCollapsed={effectiveCollapsed} />
              <SidebarLink to="/tenant/profile" icon="person" label="Perfil" isCollapsed={effectiveCollapsed} />
            </>
          )}

          {role === UserRole.OWNER && (
            <>
              <SidebarLink to="/owner/dashboard" icon="dashboard" label="Finanzas y Docs" isCollapsed={effectiveCollapsed} />
              <SidebarLink to="/owner/properties" icon="domain" label="Mis Propiedades" isCollapsed={effectiveCollapsed} />
              <SidebarLink to="/owner/calendar" icon="event" label="Calendario" isCollapsed={effectiveCollapsed} />
              <SidebarLink to="/owner/requests" icon="home_repair_service" label="Solicitudes" isCollapsed={effectiveCollapsed} />
            </>
          )}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-2">
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className={`flex items-center w-full ${effectiveCollapsed ? 'justify-center' : 'px-4'} py-2 rounded-xl transition-colors text-slate-300 hover:text-white hover:bg-white/10 group`}
          >
            <span className={`material-icons-round text-xl ${!effectiveCollapsed && 'mr-3'} group-hover:scale-110 transition-transform`}>lock_reset</span>
            {!effectiveCollapsed && <span className="font-medium text-sm">Cambiar Clave</span>}
          </button>

          <button onClick={handleLogout} className={`flex items-center w-full ${effectiveCollapsed ? 'justify-center' : 'px-4'} py-2 rounded-xl transition-colors text-red-200 hover:text-white hover:bg-white/10 group`}>
            <span className={`material-icons-round text-xl ${!effectiveCollapsed && 'mr-3'} group-hover:scale-110 transition-transform`}>logout</span>
            {!effectiveCollapsed && <span className="font-medium text-sm">Salir</span>}
          </button>

          {/* Social Links */}
          {!effectiveCollapsed && (
            <div className="flex justify-center gap-6 py-4 border-t border-white/5">
              <a href="https://www.facebook.com/share/1a7zfXytUE/?mibextid=wwXIfr" target="_blank" rel="noreferrer" className="text-white/60 hover:text-[#1877F2] hover:scale-110 transition-all duration-300" title="Facebook">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036c-2.148 0-2.971.956-2.971 3.594v.376h5.36l-.729 3.667h-4.63v7.98c0 .039 0 .076.001.112a.114.114 0 0 1 .003.048h-3.53a.915.915 0 0 1-.003-.048c0-.036.001-.073.001-.112z"></path>
                </svg>
              </a>
              <a href="https://www.instagram.com/camilagutierrez.bi?igsh=bzFybTE5MGdvYmFr&utm_source=qr" target="_blank" rel="noreferrer" className="text-white/60 hover:text-[#E4405F] hover:scale-110 transition-all duration-300" title="Instagram">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"></path>
                </svg>
              </a>
              <a href="https://www.tiktok.com/@camilagutierrez.bi?_r=1&_t=ZS-92pUHWMRQFs" target="_blank" rel="noreferrer" className="text-white/60 hover:text-white hover:scale-110 transition-all duration-300" title="TikTok">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93v6.14c0 3.48-2.32 6.66-5.74 7.57-2.69.7-5.59-.26-7.39-2.31-2.02-2.3-2.16-5.83-.22-8.23 2-2.43 5.34-3.1 8.01-1.67v4.2c-1.26-.54-2.73-.29-3.79.55-1.26.98-1.57 2.82-.69 4.18.9 1.4 2.81 1.93 4.29 1.14 1.34-.72 1.54-2.18 1.55-3.53V.02h-.1z"></path>
                </svg>
              </a>
            </div>
          )}

          {/* Developer Credit - SIKAI */}
          {!effectiveCollapsed && (
            <div className="pt-4 mt-1 border-t border-white/5 flex flex-col items-center">
              <a href="https://sikaiconsulting.com" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 group cursor-pointer">
                <span className="text-[10px] text-white/40 group-hover:text-white/90 font-medium uppercase tracking-widest transition-colors">Desarrollado por SIKAI</span>
                <img src="/sikai-icon.png" alt="SIKAI Consulting" className="h-6 w-auto opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
              </a>
            </div>
          )}
        </div>
      </aside>
      <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
    </>
  );
};

export const Layout: React.FC<{ children: React.ReactNode; role: UserRole }> = ({ children, role }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false); // Desktop Collapsed State
  const { user, loading } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const hasPerformedInitialCheck = React.useRef(false);

  // --- SECURITY: Route Guard ---
  // Calculate Authorization synchronously during render to prevent content flash

  const normalizeRole = (r: string) => {
    const lower = (r || '').toLowerCase();
    if (lower === 'admin' || lower === 'administrador') return 'ADMIN';
    if (lower === 'owner' || lower === 'propietario') return 'OWNER';
    if (lower === 'tenant' || lower === 'inquilino') return 'TENANT';
    if (lower === 'collaborator' || lower === 'colaborador') return 'COLLABORATOR';
    return 'UNKNOWN';
  };

  const currentUserRole = normalizeRole(user?.role || '');
  let isAuthorized = false;

  // Determine authorization status
  if (role === UserRole.ADMIN) {
    if (currentUserRole === 'ADMIN' || currentUserRole === 'COLLABORATOR') isAuthorized = true;
  } else if (role === UserRole.TENANT) {
    if (currentUserRole === 'TENANT') isAuthorized = true;
  } else if (role === UserRole.OWNER) {
    if (currentUserRole === 'OWNER') isAuthorized = true;
  }

  useEffect(() => {
    // 1. Wait for loading to finish
    if (loading) return;

    // 2. Only perform auth check once to avoid loops
    if (hasPerformedInitialCheck.current) return;
    hasPerformedInitialCheck.current = true;

    // 3. If not logged in after loading, redirect to Login
    if (!user) {
      if (location.pathname !== '/') {
        navigate('/');
      }
      return;
    }

    // 4. If logged in but unauthorized, redirect
    if (!isAuthorized) {
      console.warn(`Unauthorized access attempt. Role: ${user.role} (Norm: ${currentUserRole}) -> Target: ${role}`);
      if (currentUserRole === 'ADMIN' || currentUserRole === 'COLLABORATOR') navigate('/admin/dashboard');
      else if (currentUserRole === 'TENANT') navigate('/tenant/dashboard');
      else if (currentUserRole === 'OWNER') navigate('/owner/dashboard');
      else navigate('/');
    }
  }, [user, loading, isAuthorized]);

  // Prevent rendering if not authorized
  if (loading) {
    return <div className="flex h-screen w-full items-center justify-center bg-background-light dark:bg-background-dark text-slate-500">Cargando...</div>;
  }

  if (!user || !isAuthorized) {
    return null; // Don't render anything while redirecting
  }
  // -----------------------------

  // Close sidebar automatically when route changes (mobile UX)
  // FIX: This useEffect causes infinite loop (Error #310). Disabling for now.
  /*
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);
  */

  return (
    <div className="flex h-screen w-full bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-sans overflow-hidden">

      {/* Mobile Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      <Sidebar
        role={role}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isCollapsed={isCollapsed}
        toggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      {/* Main Content Area */}
      {/* Mobile: Top padding for toggle button. Desktop: No extra padding needed as sidebar is relative */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative w-full pt-16 lg:pt-0 transition-all duration-300">

        {/* Mobile Fixed Top Bar */}
        <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-card-dark shadow-sm z-30 flex items-center px-4 justify-between">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 text-primary dark:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Abrir menú"
          >
            <span className="material-icons-round text-2xl">menu</span>
          </button>

          {/* Mobile Logo centered in header */}
          <Logo className="h-10 w-10 shadow-sm" />

          <div className="w-8"></div> {/* Spacer for centering */}
        </header>

        {children}
      </main>
    </div>
  );
};