/**
 * Archivo: pages/client/profile/ProfileDashboardPage.tsx
 * Descripción: Sección "Dashboard" del perfil de cliente — resumen + calendario embebido
 *   (RF-009, punto 2 del rediseño: dashboard y calendario van juntos, no en pestañas separadas).
 * ¿Para qué? Primera pantalla al entrar a "Mi perfil": de un vistazo, cuántas mascotas tiene,
 *   sus próximas citas, cuánto ha gastado, y en qué días del mes tiene algo agendado.
 */

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PawPrint, CalendarClock, Wallet, ShoppingBag } from 'lucide-react';
import * as petsApi from '@/api/pets';
import * as appointmentsApi from '@/api/appointments';
import * as ordersApi from '@/api/orders';
import * as servicesApi from '@/api/services';
import type { Pet } from '@/types/pets';
import type { Appointment } from '@/types/appointments';
import type { Order } from '@/types/orders';
import type { Service } from '@/types/services';
import { formatCOP } from '@/types/pricing';
import { MonthCalendar } from '@/components/calendar/MonthCalendar';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';

function toDateKey(iso: string): string {
  return iso.slice(0, 10);
}

export function ProfileDashboardPage() {
  const [pets, setPets] = useState<Pet[] | null>(null);
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    petsApi.listMyPets().then(setPets).catch(() => setPets([]));
    appointmentsApi.listMyAppointments().then(setAppointments).catch(() => setAppointments([]));
    ordersApi.listMyOrders().then(setOrders).catch(() => setOrders([]));
    servicesApi.listServices().then(setServices).catch(() => setServices([]));
  }, []);

  const serviceName = (id: string) => services.find((s) => s.id === id)?.name ?? 'Servicio';
  const petName = (id: string) => pets?.find((p) => p.id === id)?.name ?? 'Mascota';

  const now = new Date();
  const upcoming = useMemo(
    () =>
      (appointments ?? [])
        .filter((a) => new Date(`${a.date}T${a.time}`) >= now && a.status !== 'cancelled')
        .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [appointments],
  );

  const eventDates = useMemo(() => {
    const map: Record<string, number> = {};
    for (const a of appointments ?? []) {
      if (a.status === 'cancelled') continue;
      const key = a.date.slice(0, 10);
      map[key] = (map[key] ?? 0) + 1;
    }
    return map;
  }, [appointments]);

  const gastoTotal = useMemo(() => {
    const fromAppointments = (appointments ?? [])
      .filter((a) => a.status === 'completed')
      .reduce((sum, a) => sum + (a.totalPrice ?? 0), 0);
    const fromOrders = (orders ?? [])
      .filter((o) => o.status === 'completed')
      .reduce((sum, o) => sum + o.total, 0);
    return fromAppointments + fromOrders;
  }, [appointments, orders]);

  const dayAppointments = useMemo(
    () => (appointments ?? []).filter((a) => selectedDate && toDateKey(a.date) === selectedDate),
    [appointments, selectedDate],
  );

  const loading = pets === null || appointments === null || orders === null;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Dashboard"
        description="Resumen de tu cuenta: mascotas, próximas citas, gasto histórico y tu calendario."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Mascotas registradas" value={pets?.length ?? '—'} icon={<PawPrint className="h-4 w-4" />} accent="brand" />
        <StatCard label="Próximas citas" value={upcoming.length} icon={<CalendarClock className="h-4 w-4" />} accent="accent" />
        <StatCard label="Gasto histórico" value={loading ? '—' : formatCOP(gastoTotal)} icon={<Wallet className="h-4 w-4" />} accent="success" />
        <StatCard label="Pedidos realizados" value={orders?.length ?? '—'} icon={<ShoppingBag className="h-4 w-4" />} accent="neutral" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader title="Calendario" description="Los días con un punto tienen al menos una cita." />
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <>
              <MonthCalendar eventDates={eventDates} selectedDate={selectedDate} onSelectDate={setSelectedDate} />

              {selectedDate && (
                <div className="mt-4 border-t border-border pt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                    {new Date(`${selectedDate}T00:00:00`).toLocaleDateString('es-CO', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </p>
                  {dayAppointments.length === 0 ? (
                    <p className="text-sm text-text-muted">Sin citas este día.</p>
                  ) : (
                    <ul className="space-y-2">
                      {dayAppointments.map((a) => (
                        <li key={a.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm">
                          <div>
                            <p className="font-medium text-text">{a.time}</p>
                            <p className="text-xs text-text-muted">
                              {serviceName(a.serviceId)} · {petName(a.petId)}
                            </p>
                          </div>
                          <StatusBadge status={a.status} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </>
          )}
        </Card>

        <Card>
          <CardHeader title="Próximas citas" actions={<Link to="/app/cita" className="text-xs font-semibold text-[color:var(--color-primary)] hover:underline">Agendar</Link>} />
          {loading ? (
            <Skeleton className="h-16 w-full" lines={2} />
          ) : upcoming.length === 0 ? (
            <EmptyState
              icon={<CalendarClock className="h-6 w-6" />}
              title="Sin citas próximas"
              description="Agenda el baño, spa o corte de tu mascota."
              action={
                <Link to="/app/cita">
                  <Button className="px-3 py-1.5 text-xs">Agendar cita</Button>
                </Link>
              }
            />
          ) : (
            <ul className="space-y-2">
              {upcoming.slice(0, 6).map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium text-text">
                      {new Date(`${a.date}T${a.time}`).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })} · {a.time}
                    </p>
                    <p className="text-xs text-text-muted">
                      {serviceName(a.serviceId)} · {petName(a.petId)}
                      {a.totalPrice != null && ` · ${formatCOP(a.totalPrice)}`}
                    </p>
                  </div>
                  <StatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
