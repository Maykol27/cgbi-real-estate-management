import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '../components/Layout';
import { useStore } from '../context/StoreContext';
import { LOGO_BASE64 } from '../constants/logo';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
      const loggedInUser = await login(email, password);

      if (loggedInUser) {
        // Normalize role for routing
        const roleLower = (loggedInUser.role || '').toLowerCase();

        if (roleLower === 'admin' || roleLower === 'colaborador' || roleLower === 'administrador') {
          navigate('/admin/dashboard');
        } else if (roleLower === 'propietario' || roleLower === 'owner') {
          navigate('/owner/dashboard');
        } else if (roleLower === 'inquilino' || roleLower === 'tenant') {
          navigate('/tenant/dashboard');
        } else {
          console.warn("Role not matched for routing:", loggedInUser.role);
          setError(`Error: Rol de usuario no reconocido (${loggedInUser.role})`);
          setIsLoading(false);
        }
      } else {
        // Login failed (StoreContext notifies, but we must stop loading)
        setError('No se pudo iniciar sesión. Verifique sus credenciales o conexión.');
        setIsLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError('Error inesperado. Intente de nuevo.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background-light dark:bg-background-dark transition-colors duration-300">
      <main className="w-full max-w-5xl mx-auto flex flex-col items-center">
        <div className="mb-10 text-center">
          <div className="inline-flex flex-col items-center justify-center">
            <img src={LOGO_BASE64} alt="CGBI Logo" className="h-32 w-auto mb-6 transition-transform hover:scale-105" />
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Correo Electrónico</label>
            <div className="relative">
              <span className="material-icons-round absolute left-3 top-3.5 text-gray-400">email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@cgbi.com"
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contraseña</label>
            <div className="relative">
              <span className="material-icons-round absolute left-3 top-3.5 text-gray-400">lock</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div className="mt-2 text-right">
              <span className="text-xs text-slate-400">Tip: Intente con 'admin@cgbi.com'</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3.5 px-4 bg-[#1a88ff] hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed transform-none' : ''}`}
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

          <div className="mt-6 text-center">
            <span className="text-sm text-gray-400">¿Olvidó su contraseña? </span>
            <a href="#" className="text-sm font-medium text-primary hover:text-blue-500 hover:underline">Recuperar acceso</a>
          </div>
        </form>

        <div className="mt-16 text-center">
          <a className="text-sm text-gray-400 hover:text-primary dark:hover:text-white transition-colors duration-200 flex items-center justify-center gap-2 group" href="#">
            <span className="material-icons-round text-lg group-hover:text-accent transition-colors">help_outline</span>
            ¿Necesita ayuda para ingresar?
          </a>
          <p className="text-xs text-gray-300 dark:text-gray-600 mt-6">© 2026 CGBI Real Estate. Todos los derechos reservados.</p>
          <a href="https://sikaiconsulting.com" target="_blank" rel="noopener noreferrer" className="block mt-2 text-xs font-semibold text-gray-300 dark:text-gray-600 hover:text-primary dark:hover:text-blue-400 transition-colors">
            Desarrollado por SIKAI
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