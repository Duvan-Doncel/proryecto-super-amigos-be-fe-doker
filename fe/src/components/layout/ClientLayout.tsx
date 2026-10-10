/**
 * Archivo: components/layout/ClientLayout.tsx
 * Descripción: Cascarón del perfil de cliente — barra superior con menú hamburguesa +
 *   sidebar de navegación propio + contenido (calcado de StaffLayout.tsx).
 * ¿Para qué? Antes /app/perfil era una sola página larga. Ahora tiene sus propias
 *   secciones (Dashboard, Datos personales, Mis mascotas, Historial) con un menú fijo,
 *   igual que ya tiene el panel de staff.
 * ¿Impacto? Reemplaza el Layout público (Navbar/Footer) SOLO dentro de /app/perfil/* — el
 *   resto de /app/* (agendar, síntoma, emergencia, tienda) sigue con el Navbar público.
 */

import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X, PawPrint, LayoutDashboard, UserRound, History } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const NAV_ITEMS = [
  { to: '/app/perfil', end: true, icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/app/perfil/datos', end: false, icon: UserRound, label: 'Datos personales' },
  { to: '/app/perfil/mascotas', end: false, icon: PawPrint, label: 'Mis mascotas' },
  { to: '/app/perfil/historial', end: false, icon: History, label: 'Historial' },
];

const SIDEBAR_STORAGE_KEY = 'clientProfileSidebarCollapsed';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-[color:var(--color-primary)] text-white'
      : 'text-text-muted hover:bg-surface-2 hover:text-text',
  ].join(' ');

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-full flex-col">
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} onClick={onNavigate} className={linkClass}>
            <item.icon className="h-4 w-4" aria-hidden="true" /> {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <div className="mb-2 px-2">
          <p className="truncate text-sm font-semibold text-text">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="truncate text-xs text-text-muted">{user?.email}</p>
        </div>
        <div className="flex items-center justify-between gap-2">
          <ThemeToggle variant="segmented" />
          <button
            onClick={handleLogout}
            aria-label="Cerrar sesión"
            className="focus-ring rounded-lg p-2 text-text-muted hover:bg-surface-2 hover:text-text"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function ClientLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SIDEBAR_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    if (window.matchMedia('(min-width: 1024px)').matches) {
      setDesktopCollapsed((c) => {
        const next = !c;
        try {
          localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? '1' : '0');
        } catch {
          /* sin persistencia: aplica solo en esta sesión */
        }
        return next;
      });
    } else {
      setMobileOpen(true);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-surface px-3 sm:px-4">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={
            mobileOpen || !desktopCollapsed ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'
          }
          aria-expanded={mobileOpen || !desktopCollapsed}
          className="focus-ring rounded-lg p-2 text-text-muted hover:bg-surface-2 hover:text-text"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <NavLink
          to="/app/perfil"
          end
          className="focus-ring flex items-center gap-2 rounded font-display text-base font-extrabold text-text"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg brand-gradient text-white">
            <PawPrint className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="hidden sm:inline">Mi perfil</span>
        </NavLink>
        <NavLink
          to="/app"
          className="focus-ring ml-auto rounded-lg px-3 py-1.5 text-sm font-medium text-text-muted hover:bg-surface-2 hover:text-text"
        >
          Volver al inicio
        </NavLink>
      </header>

      <div className="flex flex-1">
        {!desktopCollapsed && (
          <aside className="hidden w-64 shrink-0 border-r border-border bg-surface lg:block">
            <div className="sticky top-14 h-[calc(100vh-3.5rem)]">
              <SidebarContent />
            </div>
          </aside>
        )}

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-border bg-surface">
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              <span className="flex items-center gap-2 font-display text-base font-extrabold text-text">
                <span className="grid h-7 w-7 place-items-center rounded-lg brand-gradient text-white">
                  <PawPrint className="h-4 w-4" aria-hidden="true" />
                </span>
                Mi perfil
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Cerrar menú"
                className="focus-ring rounded-lg p-2 text-text-muted hover:bg-surface-2"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
