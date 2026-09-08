/**
 * Archivo: pages/client/ProfilePage.tsx
 * Descripción: Perfil del cliente — datos personales, mascotas, próximas citas e historial.
 * ¿Para qué? Un solo lugar donde el cliente ve y mantiene su información y el seguimiento de
 *   su mascota (RF-007, RF-012, RF-009, RF-016). Los datos personales editables se cambian
 *   en un pop-up; las mascotas son de solo lectura (las registra el staff).
 */

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PawPrint,
  CalendarClock,
  History,
  BadgeCheck,
  Pencil,
  ShoppingBag,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { usePagination } from '@/hooks/usePagination';
import * as authApi from '@/api/auth';
import * as petsApi from '@/api/pets';
import * as appointmentsApi from '@/api/appointments';
import * as ordersApi from '@/api/orders';
import type { Pet } from '@/types/pets';
import type { Appointment } from '@/types/appointments';
import type { Order } from '@/types/orders';
import type { Service } from '@/types/services';
import * as servicesApi from '@/api/services';
import { formatCOP } from '@/types/pricing';
import { SPECIES_LABELS, SIZE_LABELS, COAT_LABELS } from '@/types/pricing';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { InputField } from '@/components/ui/InputField';
import { Alert } from '@/components/ui/Alert';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { Skeleton } from '@/components/ui/Skeleton';

// ¿Qué? Combina cita/pedido en una fila de historial con fecha comparable.
interface HistoryRow {
  id: string;
  date: string;
  kind: 'Cita' | 'Pedido';
  detail: string;
  amount: number | null;
  status: string;
}

function EditProfileModal({
  isOpen,
  onClose,
  initial,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  initial: { firstName: string; lastName: string; phone: string };
  onSaved: () => void;
}) {
  const { refreshUser } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(initial);
      setError(null);
    }
  }, [isOpen, initial]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await authApi.updateMe({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
      });
      await refreshUser();
      showToast('Datos actualizados.', 'success');
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar datos personales"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button form="edit-profile-form" type="submit" isLoading={saving}>
            Guardar cambios
          </Button>
        </>
      }
    >
      <form id="edit-profile-form" onSubmit={submit} noValidate className="space-y-4">
        {error && <Alert type="error" message={error} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            id="firstName"
            label="Nombre"
            value={form.firstName}
            onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
            required
          />
          <InputField
            id="lastName"
            label="Apellido"
            value={form.lastName}
            onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
            required
          />
        </div>
        <InputField
          id="phone"
          label="Teléfono"
          type="tel"
          inputMode="numeric"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          required
        />
        <p className="text-xs text-text-muted">
          Para cambiar tu correo o documento, contáctanos.
        </p>
      </form>
    </Modal>
  );
}

export function ProfilePage() {
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[] | null>(null);
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [editOpen, setEditOpen] = useState(false);

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

  const history = useMemo<HistoryRow[]>(() => {
    const past = (appointments ?? [])
      .filter((a) => !upcoming.includes(a))
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
  }, [appointments, orders, upcoming, services, pets]);

  const {
    pageItems: historyPage,
    page,
    setPage,
    pageSize,
    setPageSize,
    pageCount,
    total,
  } = usePagination(history, 10);

  const loading = pets === null || appointments === null || orders === null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <PageHeader
        title="Mi perfil"
        description="Tus datos, tus mascotas y el seguimiento de sus citas y pedidos."
        backTo="/app"
        backLabel="Volver al inicio"
      />

      {/* Resumen */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Mascotas registradas" value={pets?.length ?? '—'} icon={<PawPrint className="h-4 w-4" />} accent="brand" />
        <StatCard label="Próximas citas" value={upcoming.length} icon={<CalendarClock className="h-4 w-4" />} accent="accent" />
        <StatCard label="Registros en historial" value={total} icon={<History className="h-4 w-4" />} accent="neutral" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Datos personales */}
        <Card>
          <CardHeader
            title="Datos personales"
            actions={
              <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => setEditOpen(true)}>
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Editar
              </Button>
            }
          />
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            <Field label="Nombre" value={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()} />
            <Field label="Documento" value={user?.documentId ?? '—'} />
            <div className="sm:col-span-2">
              <dt className="text-xs text-text-muted">Correo</dt>
              <dd className="mt-0.5 flex flex-wrap items-center gap-1.5 text-sm text-text">
                <span className="break-all">{user?.email}</span>
                {user?.isEmailVerified && (
                  <span className="inline-flex items-center gap-0.5 text-xs text-[color:var(--color-success)]">
                    <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" /> verificado
                  </span>
                )}
              </dd>
            </div>
            <Field label="Teléfono" value={user?.phone ?? '—'} />
            <Field
              label="Cliente desde"
              value={
                user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('es-CO', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : '—'
              }
            />
          </dl>
        </Card>

        {/* Próximas citas */}
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
              {upcoming.slice(0, 5).map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium text-text">
                      {new Date(`${a.date}T${a.time}`).toLocaleDateString('es-CO', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}{' '}
                      · {a.time}
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

        {/* Mascotas */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Mis mascotas"
            description="Las registra y actualiza el equipo de Super Amigos. ¿Un dato incorrecto? Contáctanos."
          />
          {loading ? (
            <Skeleton className="h-24 w-full" lines={2} />
          ) : (pets?.length ?? 0) === 0 ? (
            <EmptyState
              icon={<PawPrint className="h-6 w-6" />}
              title="Todavía no tienes mascotas registradas"
              description="Acércate o comunícate con nosotros para registrar a tu mascota y su ficha de cuidado."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pets!.map((p) => (
                <div key={p.id} className="rounded-xl border border-border p-4">
                  <div className="flex items-center gap-2">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-[color:var(--color-primary)]">
                      <PawPrint className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="font-semibold text-text">{p.name}</p>
                      <p className="text-xs text-text-muted">
                        {SPECIES_LABELS[p.species]}
                        {p.breed ? ` · ${p.breed}` : ''}
                      </p>
                    </div>
                  </div>
                  <dl className="mt-3 space-y-1 text-xs text-text-muted">
                    {p.size && (
                      <div className="flex justify-between">
                        <dt>Talla</dt>
                        <dd className="text-text">{SIZE_LABELS[p.size]}</dd>
                      </div>
                    )}
                    {p.coatType && (
                      <div className="flex justify-between">
                        <dt>Pelaje</dt>
                        <dd className="text-text">{COAT_LABELS[p.coatType]}</dd>
                      </div>
                    )}
                    {p.weight != null && (
                      <div className="flex justify-between">
                        <dt>Peso</dt>
                        <dd className="text-text">{p.weight} kg</dd>
                      </div>
                    )}
                  </dl>
                  {p.skinConditions.length > 0 && (
                    <p className="mt-2 text-xs text-[color:var(--color-warning)]">
                      Condiciones de piel registradas: {p.skinConditions.length}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Historial */}
        <Card className="lg:col-span-2">
          <CardHeader title="Historial" description="Citas pasadas y pedidos realizados." />
          {loading ? (
            <Skeleton className="h-24 w-full" lines={3} />
          ) : history.length === 0 ? (
            <EmptyState
              icon={<History className="h-6 w-6" />}
              title="Aún no hay historial"
              description="Aquí verás tus citas completadas y tus pedidos."
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border text-left text-xs text-text-muted">
                    <tr className="[&>th]:px-3 [&>th]:py-2">
                      <th>Fecha</th>
                      <th>Tipo</th>
                      <th>Detalle</th>
                      <th className="text-right">Monto</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border [&>tr>td]:px-3 [&>tr>td]:py-2.5">
                    {historyPage.map((row) => (
                      <tr key={row.id}>
                        <td className="whitespace-nowrap text-text-muted">
                          {new Date(row.date).toLocaleDateString('es-CO', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
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
                        <td className="whitespace-nowrap text-right text-text">
                          {row.amount != null ? formatCOP(row.amount) : '—'}
                        </td>
                        <td>
                          <StatusBadge status={row.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={page}
                pageCount={pageCount}
                total={total}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                itemNoun="registros"
              />
            </>
          )}
        </Card>
      </div>

      <EditProfileModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        initial={{
          firstName: user?.firstName ?? '',
          lastName: user?.lastName ?? '',
          phone: user?.phone ?? '',
        }}
        onSaved={() => {}}
      />
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-text">{value || '—'}</dd>
    </div>
  );
}
