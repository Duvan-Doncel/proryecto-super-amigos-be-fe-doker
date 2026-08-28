/**
 * Archivo: components/layout/Navbar.tsx
 * Descripción: Barra de navegación principal de GroomingSpa.
 * ¿Para qué? Proveer navegación consistente y acceso al toggle de tema en todas las páginas.
 * ¿Impacto? Centralizar la navbar aquí evita duplicar código en cada página.
 */

import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const homeLink = user?.role === 'staff' ? '/staff' : user?.role === 'client' ? '/app' : '/';

  return (
    <header className="border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      <nav
        className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between"
        aria-label="Navegación principal"
      >
        <Link
          to={homeLink}
          className="font-comic tracking-wide text-base text-gray-900 dark:text-slate-100 hover:text-brand-600 dark:hover:text-brand-400 transition-colors duration-200"
        >
          🐾 Super Amigos Grooming Spa
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {isAuthenticated ? (
            <>
              <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 dark:text-slate-300">
                <User className="h-4 w-4" aria-hidden="true" />
                {user?.firstName}
              </span>

              <button
                onClick={handleLogout}
                aria-label="Cerrar sesión"
                className="p-2 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors duration-200"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-3 py-1.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors duration-200"
              >
                Iniciar sesión
              </Link>
              <Link
                to="/register"
                className="px-3 py-1.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 rounded-lg transition-colors duration-200"
              >
                Registrarme
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
