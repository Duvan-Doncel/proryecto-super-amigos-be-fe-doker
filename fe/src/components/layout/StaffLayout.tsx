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

import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
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
  Plus,
  Clock,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import * as appointmentsApi from '@/api/appointments';
import * as reportsApi from '@/api/symptom-reports';
import { NotificationBell } from './NotificationBell';
import { onPendingChanged } from '@/utils/staffPending';

interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
  // ¿Qué? Clave del contador que se muestra como globo al lado del enlace.
  badge?: keyof NavBadges;
}

// ¿Qué? Contadores en vivo del menú (citas de hoy y síntomas sin revisar).
interface NavBadges {
  agenda: number;
  sintomas: number;
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
      { to: '/staff/agenda', icon: CalendarDays, label: 'Agenda del día', badge: 'agenda' },
      { to: '/staff/mascotas', icon: PlusSquare, label: 'Registrar mascota' },
      {
        to: '/staff/sintomas',
        icon: Stethoscope,
        label: 'Reportes de síntomas',
        badge: 'sintomas',
      },
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
    'focus-ring flex items-center gap-2.5 rounded-xl border px-3 py-2 text-sm transition-colors',
    isActive
      ? 'border-[color:var(--color-primary)]/30 bg-[color:var(--color-primary)]/15 font-semibold text-text'
      : 'border-transparent text-text-muted hover:bg-surface-2 hover:text-text',
  ].join(' ');

const BADGE_TONE: Record<keyof NavBadges, string> = {
  agenda: 'bg-[color:var(--color-success-soft)] text-[color:var(--color-success)]',
  // ¿Qué? Ámbar: los síntomas leves son el nivel amarillo del semáforo.
  sintomas: 'bg-[color:var(--color-warning-soft)] text-[color:var(--color-warning)]',
};

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const BADGES_REFRESH_MS = 120_000;

// ¿Qué? Carga los contadores del menú. Se recargan al cambiar de pantalla, cuando el staff
//   atiende algo (responde un síntoma, cambia una cita) y cada 2 minutos.
// ¿Para qué? Antes se cargaban una sola vez: tras responder los reportes, el menú seguía
//   mostrando "2" aunque ya no quedara ninguno. Si una fuente falla, su globo no aparece.
function useNavBadges(): NavBadges | null {
  const [badges, setBadges] = useState<NavBadges | null>(null);
  const { pathname } = useLocation();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), BADGES_REFRESH_MS);
    const stop = onPendingChanged(() => setTick((t) => t + 1));
    return () => {
      window.clearInterval(id);
      stop();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      appointmentsApi
        .getAgenda(todayIso())
        .then((a) => a.length)
        .catch(() => 0),
      reportsApi
        .listPendingReports()
        .then((r) => r.length)
        .catch(() => 0),
    ]).then(([agenda, sintomas]) => {
      if (!cancelled) setBadges({ agenda, sintomas });
    });
    return () => {
      cancelled = true;
    };
  }, [pathname, tick]);
  return badges;
}

function Brand({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link
      to="/staff"
      title="Super Amigos — Dashboard"
      className="focus-ring flex items-center gap-3 rounded-xl"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl brand-gradient text-white">
        <PawPrint className="h-6 w-6" aria-hidden="true" />
      </span>
      <span
        className={`min-w-0 whitespace-nowrap leading-tight transition-opacity duration-200 motion-reduce:transition-none ${collapsed ? 'opacity-0' : 'opacity-100'}`}
        aria-hidden={collapsed}
      >
        <span className="block font-display text-base font-bold text-text">Super Amigos</span>
        <span className="block text-xs text-text-muted">Grooming &amp; Wellness Spa</span>
        <span className="mt-1 inline-block rounded-md bg-[color:var(--color-info-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--color-info)]">
          Staff / Recepción
        </span>
      </span>
    </Link>
  );
}

// ¿Qué? `collapsed` = menú en modo íconos (solo escritorio). Los textos no se quitan del DOM:
//   se desvanecen mientras el ancho del menú se anima, así el cierre se ve fluido.
function SidebarContent({
  onNavigate,
  badges,
  collapsed = false,
}: {
  onNavigate?: () => void;
  badges: NavBadges | null;
  collapsed?: boolean;
}) {
  // ¿Qué? En modo íconos los títulos de sección se encogen a 0 de alto (no solo se vuelven
  //   invisibles) y en su lugar queda una rayita fina que separa los grupos.
  const heading = `overflow-hidden px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted/80 transition-[max-height,margin] duration-300 motion-reduce:transition-none ${
    collapsed ? 'mb-0 max-h-0' : 'mb-1.5 max-h-6'
  }`;
  const fade = `whitespace-nowrap transition-opacity duration-200 motion-reduce:transition-none ${collapsed ? 'opacity-0' : 'opacity-100'}`;
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-full flex-col">
      <nav
        className={`flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 transition-[row-gap] duration-300 motion-reduce:transition-none ${collapsed ? 'flex flex-col gap-2' : 'flex flex-col gap-5'}`}
      >
        <div>
          <p className={`${heading} ${fade}`}>Principal</p>
          <NavLink
            to="/staff"
            end
            onClick={onNavigate}
            className={linkClass}
            title={collapsed ? 'Dashboard' : undefined}
          >
            <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className={fade}>Dashboard</span>
          </NavLink>
        </div>

        {NAV_SECTIONS.map((section) => (
          <div key={section.heading}>
            {collapsed && (
              <span className="mb-2 ml-2 block h-px w-6 bg-border" aria-hidden="true" />
            )}
            <p className={`${heading} ${fade}`}>{section.heading}</p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  className={linkClass}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="relative shrink-0">
                    <item.icon className="h-4 w-4" aria-hidden="true" />
                    {/* ¿Qué? En modo íconos el contador no cabe: queda un punto sobre el ícono. */}
                    {collapsed && item.badge && badges && badges[item.badge] > 0 && (
                      <span
                        className="absolute -right-1.5 -top-1.5 h-2.5 w-2.5 rounded-full border-2 border-[color:var(--color-surface)] bg-[color:var(--color-accent)]"
                        aria-hidden="true"
                      />
                    )}
                  </span>
                  <span className={`flex-1 ${fade}`}>{item.label}</span>
                  {item.badge && badges && badges[item.badge] > 0 && (
                    <span
                      className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-semibold ${BADGE_TONE[item.badge]} ${fade}`}
                      aria-label={`${badges[item.badge]} pendientes`}
                    >
                      {badges[item.badge]}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {collapsed ? (
        // ¿Qué? `w-16` = el ancho de la barra de íconos. El contenido interno mide 288 px para que
        //   la animación no reacomode textos; sin esto, estos botones se centrarían en 288 px
        //   y quedarían fuera de la barra visible.
        <div className="flex w-16 flex-col items-center gap-2 border-t border-border py-3">
          <ThemeToggle />
          <span
            className="grid h-9 w-9 place-items-center rounded-full bg-[color:var(--color-primary)]/15 text-[color:var(--color-primary)]"
            title={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`}
          >
            <UserRound className="h-4 w-4" aria-hidden="true" />
          </span>
          <button
            onClick={handleLogout}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="focus-ring rounded-lg p-2 text-text-muted hover:bg-surface-2 hover:text-text"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div className="space-y-3 border-t border-border p-3">
          <ThemeToggle variant="segmented" />
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface-2/70 p-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[color:var(--color-primary)]/15 text-[color:var(--color-primary)]">
              <UserRound className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-text">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="truncate text-xs text-text-muted">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              aria-label="Cerrar sesión"
              className="focus-ring rounded-lg p-2 text-text-muted hover:bg-surface hover:text-text"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ¿Qué? Atajos de la barra superior a las tareas más frecuentes de recepción.
const QUICK_ACTIONS = [
  { to: '/staff/ventas', label: 'Venta', tone: 'accent' },
  { to: '/staff/mascotas', label: 'Mascota', tone: 'primary' },
  { to: '/staff/productos', label: 'Producto', tone: 'outline' },
] as const;

const QUICK_TONE = {
  accent: 'bg-[color:var(--color-accent)] text-[#2a120c] hover:opacity-90',
  primary: 'bg-[color:var(--color-primary)]/20 text-text hover:bg-[color:var(--color-primary)]/30',
  outline: 'border border-border text-text hover:bg-surface-2',
} as const;

// ¿Qué? Fecha y hora actuales en la barra (se refresca cada 30 s).
function NowChip() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  const day = now.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });
  const time = now.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' });
  return (
    <span className="hidden items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs text-text-muted md:inline-flex">
      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
      <span className="capitalize">{day}</span> · {time}
    </span>
  );
}

export function StaffLayout() {
  const { user } = useAuth();
  const badges = useNavBadges();
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
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-bg/90 px-3 backdrop-blur sm:px-5">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={
            mobileOpen || !desktopCollapsed
              ? 'Cerrar menú de navegación'
              : 'Abrir menú de navegación'
          }
          aria-expanded={mobileOpen || !desktopCollapsed}
          className="focus-ring rounded-lg p-2 text-text-muted hover:bg-surface-2 hover:text-text"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <NavLink
          to="/staff"
          end
          className={`focus-ring flex items-center gap-2 rounded font-display text-base font-bold text-text lg:hidden`}
        >
          <span className="grid h-8 w-8 place-items-center rounded-full brand-gradient text-white">
            <PawPrint className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="hidden sm:inline">Super Amigos</span>
        </NavLink>
        <NowChip />
        <div className="ml-auto flex items-center gap-2">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className={`focus-ring hidden items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium sm:inline-flex ${QUICK_TONE[a.tone]}`}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {a.label}
            </Link>
          ))}
          <NotificationBell />
          <span
            className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface text-[color:var(--color-primary)]"
            title={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`}
          >
            <UserRound className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar fijo — escritorio. Al colapsar no desaparece: se angosta (animado) y
            deja solo los íconos. El contenido interno mantiene su ancho para que los textos
            no se reacomoden durante la animación; el borde del menú simplemente los recorta. */}
        <aside
          className={`hidden shrink-0 overflow-x-clip border-r border-border bg-surface transition-[width] duration-300 ease-in-out motion-reduce:transition-none lg:block ${
            desktopCollapsed ? 'w-16' : 'w-72'
          }`}
        >
          <div className="sticky top-16 flex h-[calc(100vh-4rem)] w-72 flex-col">
            <div className="border-b border-border px-2.5 py-4">
              <Brand collapsed={desktopCollapsed} />
            </div>
            <div className="min-h-0 flex-1">
              <SidebarContent badges={badges} collapsed={desktopCollapsed} />
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Panel deslizante — móvil / tablet. Siempre montado: entra y sale con animación.
          `inert` lo saca del foco y de los lectores de pantalla mientras está cerrado. */}
      <div
        className={`fixed inset-0 z-40 lg:hidden ${mobileOpen ? '' : 'pointer-events-none'}`}
        inert={!mobileOpen}
      >
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 motion-reduce:transition-none ${
            mobileOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
        <div
          className={`absolute inset-y-0 left-0 flex w-72 flex-col border-r border-border bg-surface shadow-[var(--sh-pop)] transition-transform duration-300 ease-in-out motion-reduce:transition-none ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-4">
            <Brand />
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Cerrar menú"
              className="focus-ring rounded-lg p-2 text-text-muted hover:bg-surface-2"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div className="min-h-0 flex-1">
            <SidebarContent badges={badges} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      </div>
    </div>
  );
}
