/**
 * Archivo: components/layout/NotificationBell.tsx
 * Descripción: Campanita de notificaciones del panel de staff.
 * ¿Para qué? Avisar en cualquier pantalla de staff lo que está pendiente: síntomas sin
 *   revisar, citas sin confirmar (hoy y los próximos 6 días), pedidos de clientes por entregar, productos con
 *   poco stock y pedidos a proveedor que llegan hoy o están atrasados.
 * ¿Impacto? No hay endpoint de notificaciones: se arman con los mismos datos reales de
 *   los módulos. Una notificación desaparece sola cuando se resuelve lo pendiente. Se
 *   actualiza al abrir el panel y cada 2 minutos; si una fuente falla, solo se omite.
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Stethoscope, CalendarClock, Package, TriangleAlert, Truck, CheckCircle2 } from 'lucide-react';
import * as appointmentsApi from '@/api/appointments';
import * as reportsApi from '@/api/symptom-reports';
import * as ordersApi from '@/api/orders';
import * as productsApi from '@/api/products';
import * as supplierOrdersApi from '@/api/supplier-orders';
import { onPendingChanged } from '@/utils/staffPending';

const LOW_STOCK_THRESHOLD = 5;
const REFRESH_MS = 120_000;

type Tone = 'accent' | 'warning' | 'info' | 'success';

interface Notification {
  id: string;
  to: string;
  icon: ReactNode;
  tone: Tone;
  title: string;
  detail: string;
}

const TONE: Record<Tone, string> = {
  accent: 'bg-[color:var(--color-accent-soft)] text-[color:var(--color-danger)]',
  warning: 'bg-[color:var(--color-warning-soft)] text-[color:var(--color-warning)]',
  info: 'bg-[color:var(--color-info-soft)] text-[color:var(--color-info)]',
  success: 'bg-[color:var(--color-success-soft)] text-[color:var(--color-success)]',
};

// ¿Qué? Cuántos días hacia adelante revisa la campanita (hoy incluido).
// ¿Para qué? El staff necesita ver con tiempo las citas por confirmar, no solo las de hoy.
const UPCOMING_DAYS = 7;

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function todayIso(): string {
  return isoDate(new Date());
}

// ¿Qué? Las fechas de hoy y los próximos días, en hora local.
function nextDays(count: number): string[] {
  const base = new Date();
  return Array.from({ length: count }, (_, i) =>
    isoDate(new Date(base.getFullYear(), base.getMonth(), base.getDate() + i)),
  );
}

// ¿Qué? "mañana" o "lun 1 dic" — corto, para que quepa en el detalle.
function dayLabel(iso: string, today: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const tomorrow = nextDays(2)[1];
  if (iso === today) return 'hoy';
  if (iso === tomorrow) return 'mañana';
  return date
    .toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })
    .replace(/\./g, '');
}

function names(list: string[], max = 2): string {
  if (list.length <= max) return list.join(', ');
  return `${list.slice(0, max).join(', ')} y ${list.length - max} más`;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// ¿Qué? Pide los pendientes de cada módulo y los convierte en notificaciones.
async function loadNotifications(): Promise<Notification[]> {
  const safe = <T,>(p: Promise<T>) => p.catch(() => null);
  const today = todayIso();
  const days = nextDays(UPCOMING_DAYS);
  // ¿Qué? El API da la agenda de un día a la vez: se piden los días en paralelo y se
  //   marca cada cita con su fecha. Si un día falla, solo ese se omite.
  const agendaByDay = Promise.all(
    days.map((day) =>
      appointmentsApi
        .getAgenda(day)
        .then((list) => list.map((a) => ({ ...a, date: day })))
        .catch(() => []),
    ),
  ).then((perDay) => perDay.flat());
  const [reports, agenda, orders, products, supplierOrders] = await Promise.all([
    safe(reportsApi.listPendingReports()),
    agendaByDay,
    safe(ordersApi.listPendingOrders()),
    safe(productsApi.listProductsForStaff(true, { limit: 100 }).then((r) => r.products)),
    safe(supplierOrdersApi.listSupplierOrders()),
  ]);

  const list: Notification[] = [];

  if (reports && reports.length > 0) {
    list.push({
      id: 'sintomas',
      to: '/staff/sintomas',
      icon: <Stethoscope className="h-4 w-4" />,
      tone: 'warning',
      title: plural(reports.length, 'reporte de síntoma sin revisar', 'reportes de síntomas sin revisar'),
      detail: names(reports.map((r) => `${r.pet.name} (${r.symptom})`)),
    });
  }

  const unconfirmed = agenda.filter((a) => a.status === 'pending');
  const todayPending = unconfirmed.filter((a) => a.date === today);
  const laterPending = unconfirmed.filter((a) => a.date !== today);
  if (todayPending.length > 0) {
    list.push({
      id: 'citas',
      to: '/staff/agenda',
      icon: <CalendarClock className="h-4 w-4" />,
      tone: 'warning',
      title: plural(todayPending.length, 'cita de hoy sin confirmar', 'citas de hoy sin confirmar'),
      detail: names(todayPending.map((a) => `${a.time.slice(0, 5)} ${a.pet.name}`)),
    });
  }
  if (laterPending.length > 0) {
    // ¿Qué? Lleva a la agenda en el día de la cita más cercana.
    list.push({
      id: 'citas-proximas',
      to: `/staff/agenda?fecha=${laterPending[0].date}`,
      icon: <CalendarClock className="h-4 w-4" />,
      tone: 'info',
      title: plural(
        laterPending.length,
        `cita sin confirmar en los próximos ${UPCOMING_DAYS - 1} días`,
        `citas sin confirmar en los próximos ${UPCOMING_DAYS - 1} días`,
      ),
      detail: names(laterPending.map((a) => `${dayLabel(a.date, today)} ${a.time.slice(0, 5)} ${a.pet.name}`)),
    });
  }

  if (orders && orders.length > 0) {
    list.push({
      id: 'pedidos',
      to: '/staff/pedidos',
      icon: <Package className="h-4 w-4" />,
      tone: 'success',
      title: plural(orders.length, 'pedido de cliente por entregar', 'pedidos de clientes por entregar'),
      detail: names(orders.map((o) => `${o.client.firstName} ${o.client.lastName}`)),
    });
  }

  const low = (products ?? []).filter((p) => p.active && p.stock <= LOW_STOCK_THRESHOLD);
  if (low.length > 0) {
    list.push({
      id: 'stock',
      to: '/staff/productos',
      icon: <TriangleAlert className="h-4 w-4" />,
      tone: 'warning',
      title: plural(low.length, 'producto con poco stock', 'productos con poco stock'),
      detail: names(low.sort((a, b) => a.stock - b.stock).map((p) => `${p.name} (${p.stock} un.)`)),
    });
  }

  const due = (supplierOrders ?? []).filter(
    (o) => o.status === 'ordered' && o.expectedDate && o.expectedDate.slice(0, 10) <= today,
  );
  if (due.length > 0) {
    list.push({
      id: 'proveedores',
      to: '/staff/pedidos-proveedor',
      icon: <Truck className="h-4 w-4" />,
      tone: 'info',
      title: plural(due.length, 'pedido a proveedor llega hoy o está atrasado', 'pedidos a proveedor llegan hoy o están atrasados'),
      detail: names(due.map((o) => o.supplierName)),
    });
  }

  return list;
}

export function NotificationBell() {
  const [items, setItems] = useState<Notification[] | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const refresh = useCallback(() => {
    loadNotifications().then(setItems);
  }, []);

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, REFRESH_MS);
    // ¿Qué? También se recarga cuando el staff atiende algo en otra pantalla.
    const stop = onPendingChanged(refresh);
    return () => {
      window.clearInterval(id);
      stop();
    };
  }, [refresh]);

  // ¿Qué? Cerrar al hacer clic fuera o con Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const count = items?.length ?? 0;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) refresh();
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={count > 0 ? `Notificaciones: ${count} pendientes` : 'Notificaciones'}
        className="focus-ring relative grid h-9 w-9 place-items-center rounded-full text-text-muted hover:bg-surface-2 hover:text-text"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {count > 0 && (
          <span className="absolute right-1 top-1 flex h-2.5 w-2.5" aria-hidden="true">
            <span className="absolute inset-0 animate-ping rounded-full bg-[color:var(--color-accent)] opacity-60" />
            <span className="relative h-2.5 w-2.5 rounded-full border-2 border-[color:var(--color-bg)] bg-[color:var(--color-accent)]" />
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notificaciones"
          className="card absolute right-0 z-50 mt-2 w-[22rem] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl p-0 shadow-[var(--sh-pop)]"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="font-display font-bold text-text">Notificaciones</p>
            {count > 0 && (
              <span className="rounded-full bg-[color:var(--color-accent-soft)] px-2 py-0.5 text-xs font-semibold text-[color:var(--color-danger)]">
                {count} {count === 1 ? 'pendiente' : 'pendientes'}
              </span>
            )}
          </div>

          {items === null ? (
            <p className="px-4 py-6 text-center text-sm text-text-muted">Cargando…</p>
          ) : count === 0 ? (
            <p className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-text-muted">
              <CheckCircle2 className="h-6 w-6 text-[color:var(--color-success)]" aria-hidden="true" />
              Todo al día. No hay pendientes.
            </p>
          ) : (
            <ul className="max-h-96 divide-y divide-border overflow-y-auto">
              {items.map((n) => (
                <li key={n.id}>
                  <Link
                    to={n.to}
                    onClick={() => setOpen(false)}
                    className="focus-ring flex items-start gap-3 px-4 py-3 hover:bg-surface-2"
                  >
                    <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl ${TONE[n.tone]}`} aria-hidden="true">
                      {n.icon}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-text">{n.title}</span>
                      <span className="block truncate text-xs text-text-muted">{n.detail}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
