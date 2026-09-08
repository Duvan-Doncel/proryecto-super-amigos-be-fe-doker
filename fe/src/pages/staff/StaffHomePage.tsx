/**
 * Archivo: pages/staff/StaffHomePage.tsx
 * Descripción: Dashboard del staff — el negocio de un vistazo: KPIs, gráficos simples,
 *   agenda de hoy, alertas accionables y accesos rápidos.
 * ¿Para qué? Juntar señales de varios módulos (agenda, pedidos, síntomas, ventas,
 *   inventario, proveedores, clientes) sin endpoints nuevos.
 * ¿Impacto? Se cargan con tolerancia a fallos (`settle` + Promise.all): si una fuente
 *   falla (p. ej. por permisos), su tarjeta muestra "—" en vez de romper el dashboard.
 */

import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  Wallet,
  Users,
  ClipboardList,
  Package,
  TriangleAlert,
  Stethoscope,
  Truck,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import * as appointmentsApi from '@/api/appointments';
import * as ordersApi from '@/api/orders';
import * as reportsApi from '@/api/symptom-reports';
import * as salesApi from '@/api/sales';
import * as productsApi from '@/api/products';
import * as supplierOrdersApi from '@/api/supplier-orders';
import * as staffApi from '@/api/staff';
import type { AgendaAppointment, AppointmentStatus } from '@/types/appointments';
import type { StaffOrder } from '@/types/orders';
import type { PendingSymptomReport } from '@/types/symptom-reports';
import type { SalesReport } from '@/types/sales';
import type { Product } from '@/types/products';
import type { SupplierOrder } from '@/types/supplier-orders';
import { formatCOP } from '@/types/pricing';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { BarChart } from '@/components/charts/BarChart';
import { TrendChart } from '@/components/charts/TrendChart';

const LOW_STOCK_THRESHOLD = 5;

function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
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

const STATUS_ORDER: AppointmentStatus[] = ['pending', 'confirmed', 'completed', 'cancelled'];
const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

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
            label: new Date(`${last7[i]}T12:00`).toLocaleDateString('es-CO', { weekday: 'short' }),
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

  const agenda = data?.agenda ?? [];
  const pendingAppointments = agenda.filter((a) => a.status === 'pending').length;
  const valorPorCobrar = data?.pendingOrders?.reduce((s, o) => s + o.total, 0) ?? null;
  const activeProducts = data?.products?.filter((p) => p.active) ?? [];
  const lowStock = activeProducts.filter((p) => p.stock <= LOW_STOCK_THRESHOLD);
  const openSupplierOrders = data?.supplierOrders?.filter((o) => o.status === 'ordered').length ?? 0;
  const pendingReportsCount = data?.pendingReports?.length ?? 0;

  const topProducts =
    data?.salesMonth?.byProduct
      .slice()
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((p) => ({ label: p.name, value: p.revenue })) ?? [];

  const agendaByStatus = STATUS_ORDER.map((s) => ({
    label: STATUS_LABEL[s],
    value: agenda.filter((a) => a.status === s).length,
  })).filter((d) => d.value > 0);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={`Hola, ${user?.firstName ?? ''}`}
        description="Esto es lo que está pasando hoy en Super Amigos Grooming Spa."
        actions={
          <div className="flex flex-wrap gap-2">
            <QuickAction to="/staff/ventas" label="Registrar venta" />
            <QuickAction to="/staff/mascotas" label="Nueva mascota" />
            <QuickAction to="/staff/productos" label="Nuevo producto" />
          </div>
        }
      />

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Citas hoy"
              value={data?.agenda ? agenda.length : '—'}
              hint={data?.agenda ? `${pendingAppointments} sin confirmar` : undefined}
              icon={<CalendarDays className="h-4 w-4" />}
              accent="brand"
            />
            <StatCard
              label="Ingresos del mes"
              value={data?.salesMonth ? formatCOP(data.salesMonth.totalRevenue) : '—'}
              hint={data?.salesMonth ? `${data.salesMonth.totalOrders} transacciones` : undefined}
              icon={<Wallet className="h-4 w-4" />}
              accent="success"
            />
            <StatCard
              label="Clientes registrados"
              value={data?.totalClients ?? '—'}
              icon={<Users className="h-4 w-4" />}
              accent="accent"
            />
            <StatCard
              label="Pedidos por cobrar"
              value={data?.pendingOrders ? data.pendingOrders.length : '—'}
              hint={valorPorCobrar !== null ? `${formatCOP(valorPorCobrar)} pendientes` : undefined}
              icon={<ClipboardList className="h-4 w-4" />}
              accent={data?.pendingOrders && data.pendingOrders.length > 0 ? 'warning' : 'neutral'}
            />
          </div>

          {/* Gráficos */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader title="Ingresos de los últimos 7 días" description="Ventas de mostrador y de la app." />
              {data?.salesByDay ? (
                <TrendChart title="Ingresos últimos 7 días" data={data.salesByDay} formatValue={formatCOP} />
              ) : (
                <p className="text-sm text-text-muted">No disponible.</p>
              )}
            </Card>
            <Card>
              <CardHeader title="Citas de hoy por estado" />
              {agendaByStatus.length > 0 ? (
                <BarChart title="Citas de hoy por estado" data={agendaByStatus} />
              ) : (
                <p className="text-sm text-text-muted">No hay citas hoy.</p>
              )}
            </Card>
          </div>

          {/* Alertas + Agenda */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader
                title="Necesita tu atención"
                description="Pendientes que conviene resolver hoy."
              />
              <ul className="space-y-2">
                <AlertRow
                  to="/staff/sintomas"
                  icon={<Stethoscope className="h-4 w-4" />}
                  label="Reportes de síntomas sin revisar"
                  count={pendingReportsCount}
                  tone={pendingReportsCount > 0 ? 'warning' : 'ok'}
                />
                <AlertRow
                  to="/staff/productos"
                  icon={<TriangleAlert className="h-4 w-4" />}
                  label={`Productos con stock ≤ ${LOW_STOCK_THRESHOLD}`}
                  count={lowStock.length}
                  tone={lowStock.length > 0 ? 'warning' : 'ok'}
                />
                <AlertRow
                  to="/staff/pedidos-proveedor"
                  icon={<Truck className="h-4 w-4" />}
                  label="Pedidos a proveedor abiertos"
                  count={openSupplierOrders}
                  tone={openSupplierOrders > 0 ? 'info' : 'ok'}
                />
                <AlertRow
                  to="/staff/pedidos"
                  icon={<Package className="h-4 w-4" />}
                  label="Pedidos de clientes pendientes"
                  count={data?.pendingOrders?.length ?? 0}
                  tone={(data?.pendingOrders?.length ?? 0) > 0 ? 'warning' : 'ok'}
                />
              </ul>
            </Card>

            <Card>
              <CardHeader
                title="Agenda de hoy"
                actions={
                  <Link to="/staff/agenda" className="text-xs font-semibold text-[color:var(--color-primary)] hover:underline">
                    Ver completa
                  </Link>
                }
              />
              {!data?.agenda ? (
                <p className="text-sm text-text-muted">No disponible.</p>
              ) : agenda.length === 0 ? (
                <EmptyState icon={<CalendarDays className="h-6 w-6" />} title="Sin citas hoy" />
              ) : (
                <ul className="space-y-2">
                  {agenda.slice(0, 6).map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm"
                    >
                      <span className="text-text">
                        <span className="font-medium tabular-nums">{a.time}</span> · {a.pet.name}{' '}
                        <span className="text-text-muted">({a.client.firstName})</span>
                      </span>
                      <StatusBadge status={a.status} />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          {/* Producto estrella + top productos */}
          <Card>
            <CardHeader title="Productos más vendidos del mes" description="Por ingresos generados." />
            <BarChart title="Productos más vendidos del mes" data={topProducts} formatValue={formatCOP} />
          </Card>
        </div>
      )}
    </div>
  );
}

function QuickAction({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text hover:bg-surface-2"
    >
      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </Link>
  );
}

function AlertRow({
  to,
  icon,
  label,
  count,
  tone,
}: {
  to: string;
  icon: ReactNode;
  label: string;
  count: number;
  tone: 'ok' | 'warning' | 'info';
}) {
  const toneClass =
    tone === 'warning'
      ? 'text-[color:var(--color-warning)]'
      : tone === 'info'
        ? 'text-[color:var(--color-info)]'
        : 'text-text-muted';
  return (
    <li>
      <Link
        to={to}
        className="focus-ring flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5 text-sm hover:bg-surface-2"
      >
        <span className="flex items-center gap-2 text-text">
          <span className={toneClass}>{icon}</span>
          {label}
        </span>
        <span className="flex items-center gap-2">
          <span className={`font-display text-base font-bold ${count > 0 ? toneClass : 'text-text-muted'}`}>
            {count}
          </span>
          <ArrowRight className="h-4 w-4 text-text-muted" aria-hidden="true" />
        </span>
      </Link>
    </li>
  );
}
