/**
 * Archivo: components/layout/StaffLayout.tsx
 * Descripción: Cascarón del panel de staff — barra superior con menú hamburguesa +
 *   sidebar de navegación + contenido.
 * ¿Para qué? Todas las secciones a un clic, sin perder el "dónde estoy". El botón
 *   hamburguesa de la barra superior funciona en TODOS los tamaños: en escritorio
 *   colapsa/expande el sidebar fijo (y recuerda la preferencia en localStorage); en
 *   móvil/tablet abre el sidebar como panel deslizante sobre el contenido.
 * ¿Impacto? Reemplaza el Layout público (Navbar + Footer de marketing) en /staff/*.
 */

import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LogOut,
  Menu,
  X,
  PawPrint,
  LayoutDashboard,
  Users,
  CalendarDays,
  PlusSquare,
  Stethoscope,
  Scissors,
  Tag,
  ShoppingCart,
  ClipboardList,
  Wallet,
  BarChart3,
  Boxes,
  Truck,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
}

interface NavSection {
  heading: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    heading: 'Atención al cliente',
    items: [
      { to: '/staff/clientes', icon: Users, label: 'Clientes' },
      { to: '/staff/agenda', icon: CalendarDays, label: 'Agenda del día' },
      { to: '/staff/mascotas', icon: PlusSquare, label: 'Registrar mascota' },
      { to: '/staff/sintomas', icon: Stethoscope, label: 'Reportes de síntomas' },
    ],
  },
  {
    heading: 'Catálogo y precios',
    items: [
      { to: '/staff/servicios', icon: Scissors, label: 'Catálogo de servicios' },
      { to: '/staff/tarifario', icon: Tag, label: 'Tarifario de grooming' },
      { to: '/staff/productos', icon: ShoppingCart, label: 'Catálogo de productos' },
    ],
  },
  {
    heading: 'Ventas y pedidos',
    items: [
      { to: '/staff/pedidos', icon: ClipboardList, label: 'Pedidos pendientes' },
      { to: '/staff/ventas', icon: Wallet, label: 'Registrar venta' },
      { to: '/staff/reporte-ventas', icon: BarChart3, label: 'Reporte de ventas' },
    ],
  },
  {
    heading: 'Proveedores',
    items: [
      { to: '/staff/proveedores', icon: Boxes, label: 'Proveedores' },
      { to: '/staff/pedidos-proveedor', icon: Truck, label: 'Pedidos a proveedor' },
    ],
  },
  {
    heading: 'Administración',
    items: [{ to: '/staff/nueva-cuenta', icon: UserPlus, label: 'Nueva cuenta de staff' }],
  },
];

const SIDEBAR_STORAGE_KEY = 'staffSidebarCollapsed';

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
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        <NavLink to="/staff" end onClick={onNavigate} className={linkClass}>
          <LayoutDashboard className="h-4 w-4" aria-hidden="true" /> Dashboard
        </NavLink>

        {NAV_SECTIONS.map((section) => (
          <div key={section.heading}>
            <p className="mb-1.5 px-3 text-xs font-semibold uppercase tracking-wide text-text-muted/70">
              {section.heading}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink key={item.to} to={item.to} onClick={onNavigate} className={linkClass}>
                  <item.icon className="h-4 w-4" aria-hidden="true" /> {item.label}
                </NavLink>
              ))}
            </div>
          </div>
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

export function StaffLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SIDEBAR_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  // ¿Qué? El mismo botón hamburguesa sirve en todos los tamaños: en escritorio
  //   colapsa/expande el sidebar fijo; en móvil/tablet abre el panel deslizante.
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
      {/* Barra superior — siempre visible, con el menú hamburguesa */}
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
          to="/staff"
          end
          className="focus-ring flex items-center gap-2 rounded font-display text-base font-extrabold text-text"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg brand-gradient text-white">
            <PawPrint className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="hidden sm:inline">Super Amigos</span>
        </NavLink>
      </header>

      <div className="flex flex-1">
        {/* Sidebar fijo — escritorio. Se oculta cuando está colapsado. */}
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

      {/* Panel deslizante — móvil / tablet */}
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
                Super Amigos
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
