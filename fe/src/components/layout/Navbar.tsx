/**
 * Archivo: components/layout/Navbar.tsx
 * Descripción: Barra de navegación principal (páginas públicas y área de cliente).
 * ¿Para qué? Navegación consistente + acceso al tema. Con sesión de cliente, muestra los
 *   accesos del área (Inicio, Agendar, Tienda) y un menú de usuario desplegable (pop-up)
 *   con "Mi perfil", "Cambiar contraseña" y "Cerrar sesión".
 */

import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, PawPrint, UserRound, KeyRound } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { useAuthModal } from '@/hooks/useAuthModal';

const CLIENT_LINKS = [
  { to: '/app', label: 'Inicio', end: true },
  { to: '/app/cita', label: 'Agendar' },
  { to: '/app/tienda', label: 'Tienda' },
];

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { open } = useAuthModal();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isClient = user?.role === 'client';
  const homeLink = user?.role === 'staff' ? '/staff' : isClient ? '/app' : '/';

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
      <nav
        className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6"
        aria-label="Navegación principal"
      >
        <Link
          to={homeLink}
          className="focus-ring flex items-center gap-2 rounded font-display text-base font-extrabold text-text"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg brand-gradient text-white">
            <PawPrint className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="hidden sm:inline">Super Amigos Grooming Spa</span>
          <span className="sm:hidden">Super Amigos</span>
        </Link>

        {isClient && (
          <div className="hidden items-center gap-1 md:flex">
            {CLIENT_LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `focus-ring rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-surface-2 text-[color:var(--color-primary)]'
                      : 'text-text-muted hover:text-text'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1">
          <ThemeToggle />

          {isAuthenticated ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="focus-ring flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-text hover:bg-surface-2"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-surface-2 text-[color:var(--color-primary)]">
                  <UserRound className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="hidden max-w-24 truncate sm:inline">{user?.firstName}</span>
                <ChevronDown className="h-4 w-4 text-text-muted" aria-hidden="true" />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="card absolute right-0 mt-2 w-56 overflow-hidden p-1 shadow-[var(--shadow-pop)]"
                >
                  <div className="border-b border-border px-3 py-2">
                    <p className="truncate text-sm font-semibold text-text">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="truncate text-xs text-text-muted">{user?.email}</p>
                  </div>
                  {isClient && (
                    <MenuItem to="/app/perfil" icon={<UserRound className="h-4 w-4" />} onClick={() => setMenuOpen(false)}>
                      Mi perfil
                    </MenuItem>
                  )}
                  <MenuItem
                    to="/change-password"
                    icon={<KeyRound className="h-4 w-4" />}
                    onClick={() => setMenuOpen(false)}
                  >
                    Cambiar contraseña
                  </MenuItem>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="focus-ring flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-[color:var(--color-danger)] hover:bg-surface-2"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => open('login')}
                className="focus-ring rounded-lg px-3 py-1.5 text-sm text-text hover:bg-surface-2"
              >
                Iniciar sesión
              </button>
              <button
                type="button"
                onClick={() => open('register')}
                className="focus-ring rounded-lg bg-[color:var(--color-btn)] px-3 py-1.5 text-sm font-semibold text-[color:var(--color-btn-fg)] hover:bg-[color:var(--color-btn-hover)]"
              >
                Crear cuenta
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

function MenuItem({
  to,
  icon,
  children,
  onClick,
}: {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      to={to}
      role="menuitem"
      onClick={onClick}
      className="focus-ring flex items-center gap-2 rounded-md px-3 py-2 text-sm text-text hover:bg-surface-2"
    >
      <span className="text-text-muted">{icon}</span>
      {children}
    </Link>
  );
}
