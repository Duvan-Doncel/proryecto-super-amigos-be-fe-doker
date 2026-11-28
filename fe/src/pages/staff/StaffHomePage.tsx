/**
 * Archivo: pages/staff/StaffHomePage.tsx
 * Descripción: Dashboard del staff — el negocio de un vistazo (diseño de Google Stitch):
 *   KPIs, pendientes que necesitan atención, agenda de hoy, ingresos de 7 días y más vendidos.
 * ¿Para qué? Juntar señales de varios módulos (agenda, pedidos, síntomas, ventas,
 *   inventario, proveedores, clientes) sin endpoints nuevos.
 * ¿Impacto? Se cargan con tolerancia a fallos (`settle` + Promise.all): si una fuente
 *   falla (p. ej. por permisos), su bloque muestra "—" en vez de romper el dashboard.
 *   Todo lo que se ve sale de la API: no hay cifras de ejemplo.
 */

import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  Wallet,
  Users,
  Receipt,
  TriangleAlert,
  Stethoscope,
  Truck,
  Package,
  ArrowRight,
  ChevronRight,
  Plus,
  Clock,
  Star,
  TrendingUp,
  MapPin,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import * as appointmentsApi from '@/api/appointments';
import * as ordersApi from '@/api/orders';
import * as reportsApi from '@/api/symptom-reports';
import * as salesApi from '@/api/sales';
import * as productsApi from '@/api/products';
import * as supplierOrdersApi from '@/api/supplier-orders';
import * as staffApi from '@/api/staff';
import type { AgendaAppointment } from '@/types/appointments';
import type { StaffOrder } from '@/types/orders';
import type { PendingSymptomReport } from '@/types/symptom-reports';
import type { SalesReport } from '@/types/sales';
import type { Product } from '@/types/products';
import type { SupplierOrder } from '@/types/supplier-orders';
import { formatCOP } from '@/types/pricing';
import { BUSINESS } from '@/config/legal';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TrendChart } from '@/components/charts/TrendChart';

const LOW_STOCK_THRESHOLD = 5;

function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
const todayIso = () => isoDaysAgo(0);
const firstOfMonthIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

async function settle<T>(p: Promise<T>): Promise<T | null> {
  try {
    return await p;
  } catch {
    return null;
  }
}

// ¿Qué? Junta una lista de nombres en una línea corta: "A · B · C y 2 más".
function summarize(names: string[], max = 2): string {
  if (names.length <= max) return names.join(' · ');
  return `${names.slice(0, max).join(' · ')} y ${names.length - max} más`;
}

interface DashboardData {
  agenda: AgendaAppointment[] | null;
  pendingOrders: StaffOrder[] | null;
  pendingReports: PendingSymptomReport[] | null;
  salesMonth: SalesReport | null;
  salesByDay: { label: string; value: number }[] | null;
  products: Product[] | null;
  supplierOrders: SupplierOrder[] | null;
  totalClients: number | null;
}

export function StaffHomePage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const last7 = Array.from({ length: 7 }, (_, i) => isoDaysAgo(6 - i));

    Promise.all([
      settle(appointmentsApi.getAgenda(todayIso())),
      settle(ordersApi.listPendingOrders()),
      settle(reportsApi.listPendingReports()),
      settle(salesApi.getSalesReport(firstOfMonthIso(), todayIso())),
      settle(
        Promise.all(last7.map((d) => salesApi.getSalesReport(d, d))).then((reports) =>
          reports.map((r, i) => ({
            label:
              i === 6
                ? 'Hoy'
                : new Date(`${last7[i]}T12:00`).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' }),
            value: r.totalRevenue,
          })),
        ),
      ),
      settle(productsApi.listProductsForStaff(false, { limit: 100 }).then((r) => r.products)),
      settle(supplierOrdersApi.listSupplierOrders()),
      settle(staffApi.listClients({ limit: 1 }).then((r) => r.meta.total)),
    ]).then(
      ([agenda, pendingOrders, pendingReports, salesMonth, salesByDay, products, supplierOrders, totalClients]) => {
        if (cancelled) return;
        setData({
          agenda,
          pendingOrders,
          pendingReports,
          salesMonth,
          salesByDay,
          products,
          supplierOrders,
          totalClients,
        });
        setIsLoading(false);
      },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  const agenda = [...(data?.agenda ?? [])].sort((a, b) => a.time.localeCompare(b.time));
  const count = (s: string) => agenda.filter((a) => a.status === s).length;
  const pendingOrders = data?.pendingOrders ?? [];
  const valorPorCobrar = pendingOrders.reduce((s, o) => s + o.total, 0);
  const activeProducts = data?.products?.filter((p) => p.active) ?? [];
  const lowStock = activeProducts.filter((p) => p.stock <= LOW_STOCK_THRESHOLD).sort((a, b) => a.stock - b.stock);
  const openSupplierOrders = data?.supplierOrders?.filter((o) => o.status === 'ordered') ?? [];
  const pendingReports = data?.pendingReports ?? [];
  const salesMonth = data?.salesMonth;
  const avgTicket = salesMonth && salesMonth.totalOrders > 0 ? salesMonth.totalRevenue / salesMonth.totalOrders : null;

  const topProducts = (salesMonth?.byProduct ?? []).slice().sort((a, b) => b.revenue - a.revenue).slice(0, 3);

  const week = data?.salesByDay ?? null;
  const weekTotal = week?.reduce((s, d) => s + d.value, 0) ?? 0;
  const bestDay = week && weekTotal > 0 ? week.reduce((best, d) => (d.value > best.value ? d : best)) : null;

  const attentionCount = [pendingReports.length, lowStock.length, openSupplierOrders.length, pendingOrders.length].filter(
    (n) => n > 0,
  ).length;

  const monthName = new Date().toLocaleDateString('es-CO', { month: 'long' });

  return (
    <div className="mx-auto max-w-6xl">
      {/* ─── Encabezado ─── */}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="flex flex-wrap gap-2 text-xs text-text-muted">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-success)]" aria-hidden="true" />
              Sede {BUSINESS.ciudad}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1">
              <MapPin className="h-3 w-3" aria-hidden="true" />
              Panel de recepción
            </span>
          </div>
          <h1 className="mt-3 flex items-center gap-3 font-display text-3xl font-extrabold text-text sm:text-4xl">
            Hola, {user?.firstName}
            <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-white">
              <img
                src="/ilustraciones/cliente-saludo.png"
                alt=""
                aria-hidden="true"
                className="h-[85%] w-[85%] object-contain"
              />
            </span>
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-muted">
            Esto es lo que está pasando hoy en Super Amigos Grooming Spa.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <QuickAction to="/staff/ventas" label="Registrar venta" tone="accent" icon={<Receipt className="h-4 w-4" />} />
          <QuickAction to="/staff/mascotas" label="Nueva mascota" tone="primary" icon={<Plus className="h-4 w-4" />} />
          <QuickAction to="/staff/productos" label="Nuevo producto" tone="outline" icon={<Package className="h-4 w-4" />} />
        </div>
      </div>

      {isLoading ? (
        <div className="mt-8 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-44 w-full rounded-3xl" />
            ))}
          </div>
          <Skeleton className="h-72 w-full rounded-3xl" />
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {/* ─── KPIs ─── */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Citas de hoy"
              icon={<CalendarDays className="h-5 w-5" />}
              tone="success"
              value={data?.agenda ? String(agenda.length) : '—'}
              hint={data?.agenda ? `${count('confirmed')} confirmadas · ${count('pending')} pendientes` : undefined}
              foot={
                data?.agenda
                  ? [
                      ['Completadas', String(count('completed'))],
                      ['Canceladas', String(count('cancelled'))],
                    ]
                  : undefined
              }
            />
            <KpiCard
              label="Ingresos del mes"
              icon={<Wallet className="h-5 w-5" />}
              tone="info"
              value={salesMonth ? formatCOP(salesMonth.totalRevenue) : '—'}
              hint={salesMonth ? `${salesMonth.totalOrders} ventas en ${monthName}` : undefined}
              foot={avgTicket != null ? [['Ticket promedio', formatCOP(avgTicket)]] : undefined}
            />
            <KpiCard
              label="Comunidad"
              icon={<Users className="h-5 w-5" />}
              tone="warning"
              value={data?.totalClients != null ? String(data.totalClients) : '—'}
              hint="tutores registrados"
              foot={data?.products ? [['Productos activos', String(activeProducts.length)]] : undefined}
            />
            <KpiCard
              label="Por cobrar"
              icon={<Receipt className="h-5 w-5" />}
              tone="accent"
              value={data?.pendingOrders ? formatCOP(valorPorCobrar) : '—'}
              hint={
                data?.pendingOrders
                  ? `${pendingOrders.length} ${pendingOrders.length === 1 ? 'pedido listo' : 'pedidos listos'} para entregar y cobrar`
                  : undefined
              }
              link={{ to: '/staff/pedidos', label: 'Ver pedidos pendientes' }}
            />
          </div>

          {/* ─── Atención + agenda ─── */}
          <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
            <section className="card rounded-3xl p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[color:var(--color-accent-soft)] text-[color:var(--color-danger)]">
                    <TriangleAlert className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="font-display text-xl font-bold text-text">Necesita tu atención</h2>
                    <p className="text-sm text-text-muted">Pendientes de triaje, inventario y despachos.</p>
                  </div>
                </div>
                {attentionCount > 0 && (
                  <span className="rounded-full bg-[color:var(--color-accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--color-danger)]">
                    {attentionCount} {attentionCount === 1 ? 'pendiente' : 'pendientes'}
                  </span>
                )}
              </div>

              <ul className="mt-5 space-y-3">
                <AttentionRow
                  to="/staff/sintomas"
                  icon={<Stethoscope className="h-4 w-4" />}
                  tone="warning"
                  title="Reportes de síntomas sin revisar"
                  tag="Triaje"
                  count={pendingReports.length}
                  detail={
                    pendingReports.length > 0
                      ? summarize(pendingReports.map((r) => `${r.pet.name} (${r.symptom})`))
                      : 'Todo revisado.'
                  }
                />
                <AttentionRow
                  to="/staff/productos"
                  icon={<TriangleAlert className="h-4 w-4" />}
                  tone="warning"
                  title={`Productos con stock ≤ ${LOW_STOCK_THRESHOLD}`}
                  tag="Inventario"
                  count={lowStock.length}
                  detail={
                    lowStock.length > 0
                      ? summarize(lowStock.map((p) => `${p.name} (${p.stock} un.)`))
                      : 'Inventario al día.'
                  }
                />
                <AttentionRow
                  to="/staff/pedidos-proveedor"
                  icon={<Truck className="h-4 w-4" />}
                  tone="info"
                  title="Pedidos a proveedor en camino"
                  count={openSupplierOrders.length}
                  detail={
                    openSupplierOrders.length > 0
                      ? summarize(
                          openSupplierOrders.map((o) =>
                            o.expectedDate
                              ? `${o.supplierName} · llega ${new Date(`${o.expectedDate.slice(0, 10)}T12:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}`
                              : o.supplierName,
                          ),
                        )
                      : 'Ningún pedido abierto.'
                  }
                />
                <AttentionRow
                  to="/staff/pedidos"
                  icon={<Package className="h-4 w-4" />}
                  tone="success"
                  title="Pedidos de clientes para retiro"
                  count={pendingOrders.length}
                  detail={
                    pendingOrders.length > 0
                      ? summarize(pendingOrders.map((o) => `${o.client.firstName} ${o.client.lastName[0] ?? ''}.`))
                      : 'Nada por entregar.'
                  }
                />
              </ul>
            </section>

            <section className="card flex flex-col rounded-3xl p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 font-display text-xl font-bold text-text">
                  <Clock className="h-5 w-5 text-text-muted" aria-hidden="true" />
                  Agenda de hoy
                </h2>
                <Link
                  to="/staff/agenda"
                  className="focus-ring inline-flex items-center gap-1 rounded text-xs text-text-muted hover:text-text"
                >
                  Ver completa <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>

              {!data?.agenda ? (
                <p className="mt-5 text-sm text-text-muted">No disponible.</p>
              ) : agenda.length === 0 ? (
                <div className="mt-5 grid flex-1 place-items-center rounded-2xl border border-dashed border-border p-8 text-center text-sm text-text-muted">
                  <span>
                    <CalendarDays className="mx-auto mb-2 h-6 w-6" aria-hidden="true" />
                    Sin citas para hoy.
                  </span>
                </div>
              ) : (
                <ul className="mt-5 space-y-3">
                  {agenda.slice(0, 4).map((a) => (
                    <li key={a.id} className="rounded-2xl border border-border bg-surface-2/60 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="rounded-lg border border-border bg-surface px-2 py-0.5 text-xs font-semibold tabular-nums text-text">
                            {a.time.slice(0, 5)}
                          </span>
                          <span className="truncate font-semibold text-text">{a.pet.name}</span>
                        </div>
                        <StatusBadge status={a.status} />
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                        <span className="truncate text-text-muted">{a.service.name}</span>
                        <span className="shrink-0 text-xs text-text-muted">
                          Tutor: <span className="font-medium text-text">{a.client.firstName}</span>
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {data?.agenda && agenda.length > 0 && (
                <p className="mt-5 flex justify-between border-t border-border pt-4 text-xs text-text-muted">
                  <span>{agenda.length} citas hoy</span>
                  {agenda.length > 4 && <span>+{agenda.length - 4} en la agenda</span>}
                </p>
              )}
            </section>
          </div>

          {/* ─── Ingresos + más vendidos ─── */}
          <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
            <section className="card rounded-3xl p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">Métricas de venta</p>
                  <h2 className="mt-1 font-display text-xl font-bold text-text">Ingresos de los últimos 7 días</h2>
                </div>
                {week && (
                  <span className="rounded-xl border border-border bg-surface-2 px-3 py-1.5 text-sm font-semibold text-text">
                    {formatCOP(weekTotal)} COP
                  </span>
                )}
              </div>
              <div className="mt-5">
                {week ? (
                  <TrendChart title="Ingresos últimos 7 días" data={week} formatValue={formatCOP} />
                ) : (
                  <p className="text-sm text-text-muted">No disponible.</p>
                )}
              </div>
              {bestDay && (
                <p className="mt-4 flex items-center gap-2 border-t border-border pt-4 text-sm text-text-muted">
                  <TrendingUp className="h-4 w-4 text-[color:var(--color-success)]" aria-hidden="true" />
                  Día con más ingresos:{' '}
                  <span className="font-semibold capitalize text-text">
                    {bestDay.label} ({formatCOP(bestDay.value)})
                  </span>
                </p>
              )}
            </section>

            <section className="card flex flex-col rounded-3xl p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 font-display text-xl font-bold text-text">
                    <Star className="h-5 w-5 text-[color:var(--color-accent)]" aria-hidden="true" />
                    Más vendidos
                  </h2>
                  <p className="text-sm text-text-muted">Productos con más ingresos este mes.</p>
                </div>
                <span className="rounded-full border border-border px-3 py-1 text-xs capitalize text-text-muted">
                  {monthName}
                </span>
              </div>

              {topProducts.length === 0 ? (
                <p className="mt-5 text-sm text-text-muted">Aún no hay ventas este mes.</p>
              ) : (
                <ol className="mt-5 space-y-3">
                  {topProducts.map((p, i) => (
                    <li key={p.productId} className="flex items-center gap-3 rounded-2xl border border-border bg-surface-2/60 p-3">
                      <span
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-sm font-bold ${
                          i === 0
                            ? 'bg-[color:var(--color-success-soft)] text-[color:var(--color-success)]'
                            : 'bg-[color:var(--color-info-soft)] text-[color:var(--color-info)]'
                        }`}
                      >
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-text">{p.name}</p>
                        <p className="text-xs text-text-muted">{p.unitsSold} unidades vendidas</p>
                      </div>
                      <span className="text-sm font-semibold text-text">{formatCOP(p.revenue)}</span>
                    </li>
                  ))}
                </ol>
              )}

              <div className="min-h-5 flex-1" />
              <Link
                to="/staff/productos"
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-sm font-medium text-text hover:bg-border/60"
              >
                Ir al catálogo de productos e inventario
              </Link>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

type Tone = 'success' | 'info' | 'warning' | 'accent';

const TONE_SOFT: Record<Tone, string> = {
  success: 'bg-[color:var(--color-success-soft)] text-[color:var(--color-success)]',
  info: 'bg-[color:var(--color-info-soft)] text-[color:var(--color-info)]',
  warning: 'bg-[color:var(--color-warning-soft)] text-[color:var(--color-warning)]',
  accent: 'bg-[color:var(--color-accent-soft)] text-[color:var(--color-danger)]',
};

const QUICK_TONE = {
  accent: 'bg-[color:var(--color-accent)] text-[#2a120c] hover:opacity-90',
  primary: 'bg-[color:var(--color-primary)]/20 text-text hover:bg-[color:var(--color-primary)]/30',
  outline: 'border border-border bg-surface text-text hover:bg-surface-2',
} as const;

function QuickAction({
  to,
  label,
  tone,
  icon,
}: {
  to: string;
  label: string;
  tone: keyof typeof QUICK_TONE;
  icon: ReactNode;
}) {
  return (
    <Link
      to={to}
      className={`focus-ring inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${QUICK_TONE[tone]}`}
    >
      <span aria-hidden="true">{icon}</span>
      {label}
    </Link>
  );
}

function KpiCard({
  label,
  icon,
  tone,
  value,
  hint,
  foot,
  link,
}: {
  label: string;
  icon: ReactNode;
  tone: Tone;
  value: string;
  hint?: string;
  foot?: [string, string][];
  link?: { to: string; label: string };
}) {
  return (
    <div className="card flex flex-col rounded-3xl p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">{label}</p>
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${TONE_SOFT[tone]}`} aria-hidden="true">
          {icon}
        </span>
      </div>
      <p className="mt-3 break-words font-display text-3xl font-extrabold text-text">{value}</p>
      {hint && <p className="mt-1 text-sm text-text-muted">{hint}</p>}
      <div className="min-h-4 flex-1" />
      {foot && (
        <dl className="flex justify-between gap-3 rounded-2xl bg-surface-2 px-3 py-2.5 text-xs">
          {foot.map(([k, v]) => (
            <div key={k}>
              <dt className="text-text-muted">{k}</dt>
              <dd className="font-semibold text-text">{v}</dd>
            </div>
          ))}
        </dl>
      )}
      {link && (
        <Link
          to={link.to}
          className="focus-ring flex items-center justify-between rounded-2xl bg-surface-2 px-3 py-2.5 text-xs font-medium text-[color:var(--color-danger)] hover:bg-border/60"
        >
          {link.label}
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

function AttentionRow({
  to,
  icon,
  tone,
  title,
  tag,
  count,
  detail,
}: {
  to: string;
  icon: ReactNode;
  tone: Tone;
  title: string;
  tag?: string;
  count: number;
  detail: string;
}) {
  const active = count > 0;
  return (
    <li>
      <Link
        to={to}
        className="focus-ring flex items-center gap-4 rounded-2xl border border-border bg-surface-2/60 p-4 transition-colors hover:bg-surface-2"
      >
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${active ? TONE_SOFT[tone] : 'bg-surface text-text-muted'}`}
          aria-hidden="true"
        >
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-text">{title}</span>
            {tag && active && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${TONE_SOFT[tone]}`}>
                {tag}
              </span>
            )}
          </span>
          <span className="mt-0.5 block truncate text-sm text-text-muted">{detail}</span>
        </span>
        <span
          className={`grid h-7 min-w-7 place-items-center rounded-full px-2 text-xs font-bold ${
            active ? TONE_SOFT[tone] : 'bg-surface text-text-muted'
          }`}
        >
          {count}
        </span>
        <ArrowRight className="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
      </Link>
    </li>
  );
}
