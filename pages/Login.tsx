import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '../components/Layout';
import { useStore } from '../context/StoreContext';
import { LOGO_BASE64 } from '../constants/logo';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, user } = useStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Auto-redirect if user is already logged in
  React.useEffect(() => {
    if (user) {
      console.log("CGBI Debug - Auto Redirecting user:", user.email, "Role:", user.role);
      const roleLower = user.role?.toLowerCase().trim() || '';

      if (['admin', 'administrador', 'administrator'].includes(roleLower)) {
        navigate('/admin/dashboard');
      } else if (['owner', 'propietario', 'landlord'].includes(roleLower)) {
        navigate('/owner/dashboard');
      } else if (['tenant', 'arrendatario', 'inquilino'].includes(roleLower)) {
        navigate('/tenant/dashboard');
      } else {
        // Fallback for unknown roles - maybe go to owner for now or show error
        console.warn("Unknown role for auto-redirect:", roleLower);
        // navigate('/owner'); // Safer not to force if unknown
      }
    }
  }, [user, navigate]);


  const handleLogin = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!email || !password) {
      setError("Por favor complete todos los campos");
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      // Clear manual error before trying
      const loggedInUser = await login(email, password);

      if (loggedInUser) {
        // Navigation is handled by the useEffect above now, or we can keep explicit nav here too
        // But purely relying on 'user' state update is safer for consistency.
        // However, 'login' returns the user immediately, while 'user' state update might be batched.
        // Let's keep the explicit navigation in handleLogin as a backup or for immediate feedback.

        const roleLower = loggedInUser.role?.toLowerCase().trim();
        console.log("CGBI Debug - Login Success Role:", roleLower);

        if (['admin', 'administrador', 'administrator'].includes(roleLower)) {
          navigate('/admin');
        } else if (['owner', 'propietario', 'landlord'].includes(roleLower)) {
          navigate('/owner');
        } else if (['tenant', 'arrendatario', 'inquilino'].includes(roleLower)) {
          navigate('/tenant');
        } else {
          // If role is missing/unknown but login succeeded, default to owner
          console.warn("Role not recognized in handleLogin, defaulting to Owner dashboard");
          navigate('/owner');
        }

      } else {
        setError('No se pudo iniciar sesión. Verifique sus credenciales.');
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error("Login error caught:", err);
      setError(err.message || 'Error al conectar con el servidor');
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background-light dark:bg-background-dark transition-colors duration-300">
      <main className="w-full max-w-5xl mx-auto flex flex-col items-center">
        <div className="mb-10 text-center">
          <div className="inline-flex flex-col items-center justify-center">
            <div className="h-32 w-32 rounded-full overflow-hidden mb-6 border-4 border-white shadow-lg bg-white flex items-center justify-center p-4">
              <img src="/sikai-logo.png" alt="CGBI Logo" className="h-full w-full object-contain transition-transform hover:scale-105" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-primary dark:text-white mt-2 tracking-tight">
            Iniciar Sesión
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-3 text-base font-normal">
            Ingrese sus credenciales para acceder a la plataforma.
          </p>
        </div>

        <form onSubmit={handleLogin} className="w-full max-w-md bg-white dark:bg-card-dark p-8 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700">

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
              <span className="material-icons-round">error_outline</span>
              {error}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Correo Electrónico</label>
            <div className="relative">
              <span className="material-icons-round absolute left-3 top-3.5 text-gray-400">email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@cgbi.com"
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
            <div className="relative">
              <span className="material-icons-round absolute left-3 top-3.5 text-gray-400">lock</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div className="mt-2 text-right">
              <a href="#" className="text-sm font-medium text-primary hover:text-secondary transition-colors">
                ¿Olvidó su contraseña? <span className="font-bold">Recuperar acceso</span>
              </a>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3.5 px-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl shadow-lg shadow-primary/30 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed transform-none' : ''}`}
          >
            {isLoading ? (
              <>
                <span className="animate-spin material-icons-round text-sm">refresh</span>
                <span>Procesando...</span>
              </>
            ) : (
              <>
                <span>Ingresar</span>
                <span className="material-icons-round text-sm">login</span>
              </>
            )}
          </button>


        </form>

        <div className="mt-16 text-center">
          <p className="text-xs text-gray-300 dark:text-gray-600 mt-6">© 2026 Tú CGBI</p>
          <a href="https://sikaiconsulting.com" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 mt-2 text-xs font-semibold text-gray-300 dark:text-gray-600 hover:text-primary dark:hover:text-blue-400 transition-colors group">
            <span>Desarrollado por SIKAI</span>
            <img src="/sikai-icon.png" alt="SIKAI" className="h-5 w-auto opacity-70 group-hover:opacity-100 transition-opacity" />
          </a>
        </div>
      </main>
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>
    </div>
  );
};

export default Login;