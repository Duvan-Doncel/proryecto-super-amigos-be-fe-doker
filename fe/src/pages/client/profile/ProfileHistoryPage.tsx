/**
 * Archivo: pages/client/profile/ProfileHistoryPage.tsx
 * Descripción: Sección "Historial" del perfil de cliente — citas y pedidos pasados, con
 *   filtros avanzados y numeración de fila (RF-009, RF-016).
 * ¿Para qué? Antes de esta separación era una tabla más dentro de una página larga; ahora
 *   tiene su propio espacio y permite filtrar por tipo, estado y rango de fechas.
 */

import { useEffect, useMemo, useState } from 'react';
import { ShoppingBag, CalendarClock } from 'lucide-react';
import * as petsApi from '@/api/pets';
import * as appointmentsApi from '@/api/appointments';
import * as ordersApi from '@/api/orders';
import * as servicesApi from '@/api/services';
import type { Pet } from '@/types/pets';
import type { Appointment } from '@/types/appointments';
import type { Order } from '@/types/orders';
import type { Service } from '@/types/services';
import { formatCOP } from '@/types/pricing';
import { rowNumber } from '@/utils/tablePaging';
import { usePagination } from '@/hooks/usePagination';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { FilterBar } from '@/components/ui/FilterBar';
import { SelectField } from '@/components/ui/SelectField';
import { InputField } from '@/components/ui/InputField';

interface HistoryRow {
  id: string;
  date: string;
  kind: 'Cita' | 'Pedido';
  detail: string;
  amount: number | null;
  status: string;
}

const STATUS_OPTIONS = ['pending', 'confirmed', 'completed', 'cancelled'];
const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

export function ProfileHistoryPage() {
  const [pets, setPets] = useState<Pet[] | null>(null);
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [services, setServices] = useState<Service[]>([]);

  const [kindFilter, setKindFilter] = useState<'' | 'Cita' | 'Pedido'>('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    petsApi.listMyPets().then(setPets).catch(() => setPets([]));
    appointmentsApi.listMyAppointments().then(setAppointments).catch(() => setAppointments([]));
    ordersApi.listMyOrders().then(setOrders).catch(() => setOrders([]));
    servicesApi.listServices().then(setServices).catch(() => setServices([]));
  }, []);

  const serviceName = (id: string) => services.find((s) => s.id === id)?.name ?? 'Servicio';
  const petName = (id: string) => pets?.find((p) => p.id === id)?.name ?? 'Mascota';

  const now = new Date();
  const allRows = useMemo<HistoryRow[]>(() => {
    const past = (appointments ?? [])
      .filter((a) => new Date(`${a.date}T${a.time}`) < now || a.status === 'cancelled')
      .map<HistoryRow>((a) => ({
        id: `apt-${a.id}`,
        date: `${a.date}T${a.time}`,
        kind: 'Cita',
        detail: `${serviceName(a.serviceId)} · ${petName(a.petId)}`,
        amount: a.totalPrice,
        status: a.status,
      }));
    const ords = (orders ?? []).map<HistoryRow>((o) => ({
      id: `ord-${o.id}`,
      date: o.createdAt,
      kind: 'Pedido',
      detail: o.items.map((i) => `${i.quantity}× ${i.name}`).join(', ') || 'Pedido',
      amount: o.total,
      status: o.status,
    }));
    return [...past, ...ords].sort((a, b) => b.date.localeCompare(a.date));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointments, orders, services, pets]);

  const filtered = useMemo(() => {
    return allRows.filter((row) => {
      if (kindFilter && row.kind !== kindFilter) return false;
      if (statusFilter && row.status !== statusFilter) return false;
      if (dateFrom && row.date.slice(0, 10) < dateFrom) return false;
      if (dateTo && row.date.slice(0, 10) > dateTo) return false;
      return true;
    });
  }, [allRows, kindFilter, statusFilter, dateFrom, dateTo]);

  const { pageItems, page, setPage, pageSize, setPageSize, pageCount, total } = usePagination(filtered, 10);
  const hasActiveFilters = kindFilter !== '' || statusFilter !== '' || dateFrom !== '' || dateTo !== '';
  const loading = pets === null || appointments === null || orders === null;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Historial"
        description="Todas tus citas pasadas y pedidos realizados, en un solo lugar."
      />

      <FilterBar
        onClear={() => {
          setKindFilter('');
          setStatusFilter('');
          setDateFrom('');
          setDateTo('');
        }}
        hasActiveFilters={hasActiveFilters}
      >
        <div className="w-36">
          <SelectField id="kind-filter" label="Tipo" value={kindFilter} onChange={(e) => setKindFilter(e.target.value as 'Cita' | 'Pedido' | '')}>
            <option value="">Todos</option>
            <option value="Cita">Cita</option>
            <option value="Pedido">Pedido</option>
          </SelectField>
        </div>
        <div className="w-40">
          <SelectField id="status-filter" label="Estado" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Todos</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </SelectField>
        </div>
        <div className="w-40">
          <InputField id="date-from" label="Desde" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="w-40">
          <InputField id="date-to" label="Hasta" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </FilterBar>

      <DataTable
        head={
          <>
            <th>#</th>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Detalle</th>
            <th className="text-right">Monto</th>
            <th>Estado</th>
          </>
        }
        isLoading={loading}
        isEmpty={!loading && total === 0}
        emptyTitle={hasActiveFilters ? 'Sin resultados con estos filtros' : 'Aún no hay historial'}
        emptyDescription={hasActiveFilters ? undefined : 'Aquí verás tus citas completadas y tus pedidos.'}
      >
        {pageItems.map((row, i) => (
          <tr key={row.id}>
            <td className="text-text-muted">{rowNumber(page, pageSize, i)}</td>
            <td className="whitespace-nowrap text-text-muted">
              {new Date(row.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
            </td>
            <td>
              <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                {row.kind === 'Pedido' ? (
                  <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {row.kind}
              </span>
            </td>
            <td className="max-w-xs truncate text-text">{row.detail}</td>
            <td className="whitespace-nowrap text-right text-text">{row.amount != null ? formatCOP(row.amount) : '—'}</td>
            <td>
              <StatusBadge status={row.status} />
            </td>
          </tr>
        ))}
      </DataTable>

      {!loading && total > 0 && (
        <Pagination
          page={page}
          pageCount={pageCount}
          total={total}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemNoun="registros"
        />
      )}
    </div>
  );
}
