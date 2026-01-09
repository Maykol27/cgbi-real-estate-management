import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo, ThemeToggle } from '../components/Layout';
import { useStore } from '../context/StoreContext';
import { supabase } from '../lib/supabaseClient';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, users } = useStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Just for UI, not real validation yet
  const [error, setError] = useState('');

  // Debug mount
  React.useEffect(() => {
    // console.log("Login Component MOUNTED");
  }, []);

  const handleLogin = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    console.log("LOGIN BUTTON CLICKED - Handler Starting"); // DEBUG
    if (!email || !password) {
      console.warn("Missing fields");
      setError("Por favor complete todos los campos");
      return;
    }
    setError('');

    const loggedInUser = await login(email, password);
    console.log("Login result:", loggedInUser); // DEBUG

    if (loggedInUser) {
      console.log("User role:", loggedInUser.role); // DEBUG
      if (loggedInUser.role === 'Admin' || loggedInUser.role === 'Colaborador') {
        navigate('/admin/dashboard');
      } else if (loggedInUser.role === 'Propietario') {
        navigate('/owner/dashboard');
      } else if (loggedInUser.role === 'Inquilino') {
        navigate('/tenant/dashboard');
      } else {
        console.warn("Role not matched:", loggedInUser.role); // DEBUG
      }
    } else {
      // Error is likely already handled by notify in StoreContext, 
      // but strictly speaking we can show a generic message if no error state was set.
      setError('No se pudo iniciar sesión. Verifique sus credenciales.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background-light dark:bg-background-dark transition-colors duration-300">
      <main className="w-full max-w-5xl mx-auto flex flex-col items-center">
        <div className="mb-10 text-center">
          <div className="inline-flex flex-col items-center justify-center">
            <Logo className="h-24 w-24 md:h-28 md:w-28 mb-6 bg-white rounded-2xl shadow-lg p-2" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-primary dark:text-white mt-2 tracking-tight">
            Iniciar Sesión
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-3 text-base font-normal">
            Ingrese sus credenciales para acceder a la plataforma.
          </p>
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="w-full max-w-md bg-white dark:bg-card-dark p-8 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700">

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
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              // required removed for manual handling
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
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              // required removed for manual handling
              />
            </div>
            <div className="mt-2 text-right">
              <span className="text-xs text-slate-400">Tip: Intente con 'admin@cgbi.com'</span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 bg-primary hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-primary/30 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span>Ingresar</span>
            <span className="material-icons-round text-sm">login</span>
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