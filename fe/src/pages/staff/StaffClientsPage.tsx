/**
 * Archivo: pages/staff/StaffClientsPage.tsx
 * Descripción: Directorio de clientes del negocio (apoyo a RF-012).
 * ¿Para qué? Ver de un vistazo quiénes son los clientes, cuántas mascotas tiene cada uno
 *   y desde cuándo, con búsqueda y paginación reales contra el backend. Al abrir un cliente
 *   se ven sus mascotas registradas sin salir de la pantalla.
 *   También permite DAR DE BAJA a un cliente (y reactivarlo): deja de poder entrar y sale
 *   de la lista activa, pero su historial se conserva.
 */

import { useEffect, useMemo, useState } from 'react';
import { Users, Search, PawPrint, Mail, Phone, IdCard, UserX, UserCheck, CalendarX } from 'lucide-react';
import * as staffApi from '@/api/staff';
import * as petsApi from '@/api/pets';
import type { ClientStatusFilter, ClientSummary, ClientsMeta } from '@/types/staff';
import type { Pet } from '@/types/pets';
import { SPECIES_LABELS } from '@/types/pricing';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { FilterBar } from '@/components/ui/FilterBar';
import { SelectField } from '@/components/ui/SelectField';
import { rowNumber } from '@/utils/tablePaging';
import { useToast } from '@/hooks/useToast';

const formatShortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });

export function StaffClientsPage() {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [meta, setMeta] = useState<ClientsMeta | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [hasPets, setHasPets] = useState<'' | 'true' | 'false'>('');
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<ClientSummary | null>(null);
  const [status, setStatus] = useState<ClientStatusFilter>('active');
  // ¿Qué? Cliente al que se le está dando de baja / reactivando (abre el diálogo).
  const [toDeactivate, setToDeactivate] = useState<ClientSummary | null>(null);
  const [toReactivate, setToReactivate] = useState<ClientSummary | null>(null);
  // ¿Qué? Se incrementa para volver a pedir la lista tras una baja o reactivación.
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    // ¿Qué? Marca "cargando" antes de la petición. Es el patrón estándar de fetch en efecto
    //   (mismo que ShopPage); el `active` de arriba evita el setState tras desmontar.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    staffApi
      .listClients({ page, limit: pageSize, q: search || undefined, hasPets: hasPets || undefined, status })
      .then((r) => {
        if (!active) return;
        setClients(r.clients);
        setMeta(r.meta);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, pageSize, search, hasPets, status, reloadKey]);

  const hasActiveFilters = search !== '' || hasPets !== '' || status !== 'active';
  const clearFilters = () => {
    setSearchInput('');
    setSearch('');
    setHasPets('');
    setStatus('active');
    setPage(1);
  };
  const reload = () => setReloadKey((k) => k + 1);

  const totalPets = useMemo(() => clients.reduce((n, c) => n + (c.petCount ?? 0), 0), [clients]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Clientes"
        description="Directorio de clientes registrados, sus mascotas y su antigüedad."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label={status === 'inactive' ? 'Dados de baja' : status === 'all' ? 'Clientes (todos)' : 'Clientes activos'}
          value={meta?.total ?? '—'} icon={<Users className="h-4 w-4" />} accent="brand" />
        <StatCard label="En esta página" value={clients.length} icon={<Users className="h-4 w-4" />} accent="neutral" />
        <StatCard label="Mascotas (en esta página)" value={totalPets} icon={<PawPrint className="h-4 w-4" />} accent="accent" />
      </div>

      <FilterBar onClear={clearFilters} hasActiveFilters={hasActiveFilters}>
        <form onSubmit={onSearch} className="flex gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden="true" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por nombre, correo o documento…"
              maxLength={100}
              className="focus-ring w-64 rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm text-text"
            />
          </div>
          <Button type="submit" variant="secondary" className="px-4 text-sm">
            Buscar
          </Button>
        </form>
        <div className="w-44">
          <SelectField
            id="has-pets-filter"
            label="Mascotas"
            value={hasPets}
            onChange={(e) => {
              setHasPets(e.target.value as '' | 'true' | 'false');
              setPage(1);
            }}
          >
            <option value="">Todos</option>
            <option value="true">Con mascotas</option>
            <option value="false">Sin mascotas</option>
          </SelectField>
        </div>
        <div className="w-44">
          <SelectField
            id="status-filter"
            label="Estado"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as ClientStatusFilter);
              setPage(1);
            }}
          >
            <option value="active">Activos</option>
            <option value="inactive">Dados de baja</option>
            <option value="all">Todos</option>
          </SelectField>
        </div>
      </FilterBar>

      <DataTable
        head={
          <>
            <th>#</th>
            <th>Cliente</th>
            <th>Contacto</th>
            <th>Documento</th>
            <th>Mascotas</th>
            <th>Cliente desde</th>
            <th className="text-right">Acción</th>
          </>
        }
        isLoading={isLoading}
        isEmpty={!isLoading && clients.length === 0}
        emptyTitle={
          status === 'inactive' && search === '' && hasPets === ''
            ? 'No hay clientes dados de baja'
            : hasActiveFilters
              ? 'Sin resultados con estos filtros'
              : 'Aún no hay clientes'
        }
      >
        {clients.map((c, i) => (
          <tr key={c.id} className={c.deactivatedAt ? 'opacity-70' : undefined}>
            <td className="text-text-muted">{rowNumber(meta?.page ?? page, pageSize, i)}</td>
            <td className="font-medium text-text">
              {c.firstName} {c.lastName}
              {c.deactivatedAt && (
                <span className="mt-1 flex w-fit items-center gap-1 rounded-full bg-[color:var(--color-accent-soft)] px-2 py-0.5 text-[11px] font-medium text-[color:var(--color-danger)]">
                  <UserX className="h-3 w-3" aria-hidden="true" />
                  Dado de baja · {formatShortDate(c.deactivatedAt)}
                </span>
              )}
            </td>
            <td className="text-text-muted">
              <span className="block">{c.email}</span>
              <span className="block text-xs">{c.phone ?? 'sin teléfono'}</span>
            </td>
            <td className="text-text-muted">{c.documentId ?? '—'}</td>
            <td>
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-xs font-medium text-text">
                <PawPrint className="h-3 w-3" aria-hidden="true" />
                {c.petCount ?? 0}
              </span>
            </td>
            <td className="whitespace-nowrap text-text-muted">
              {c.createdAt
                ? new Date(c.createdAt).toLocaleDateString('es-CO', { month: 'short', year: 'numeric' })
                : '—'}
            </td>
            <td className="text-right">
              <div className="flex justify-end gap-2">
                <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => setSelected(c)}>
                  Ver ficha
                </Button>
                {c.deactivatedAt ? (
                  <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => setToReactivate(c)}>
                    <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    Reactivar
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    className="px-3 py-1.5 text-xs text-[color:var(--color-danger)]"
                    onClick={() => setToDeactivate(c)}
                    aria-label={`Dar de baja a ${c.firstName} ${c.lastName}`}
                  >
                    <UserX className="h-3.5 w-3.5" aria-hidden="true" />
                    Dar de baja
                  </Button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </DataTable>

      {meta && (
        <Pagination
          page={meta.page}
          pageCount={meta.totalPages}
          total={meta.total}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemNoun="clientes"
        />
      )}

      <ClientDetailModal client={selected} onClose={() => setSelected(null)} />
      <DeactivateClientDialog
        client={toDeactivate}
        onClose={() => setToDeactivate(null)}
        onDone={() => {
          setToDeactivate(null);
          reload();
        }}
      />
      <ReactivateClientDialog
        client={toReactivate}
        onClose={() => setToReactivate(null)}
        onDone={() => {
          setToReactivate(null);
          reload();
        }}
      />
    </div>
  );
}

// ¿Qué? Diálogo para dar de baja a un cliente, con motivo opcional.
// ¿Para qué? Explicar antes de confirmar qué pasa (pierde el acceso, se cancelan sus citas
//   futuras y pedidos pendientes) y qué NO pasa (su historial se conserva).
function DeactivateClientDialog({
  client,
  onClose,
  onDone,
}: {
  client: ClientSummary | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const { showToast } = useToast();
  const [reason, setReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  // ¿Qué? Mismas reglas que valida el backend (utils/limits.ts → safeText): máx. 300
  //   caracteres y sin signos < >. Aquí solo se avisa antes de enviar; el backend es quien
  //   realmente lo impide.
  const hasForbiddenChars = /[<>]/.test(reason);

  const close = () => {
    if (isSaving) return;
    setReason('');
    onClose();
  };

  const confirm = async () => {
    if (!client || hasForbiddenChars) return;
    setIsSaving(true);
    try {
      const r = await staffApi.deactivateClient(client.id, reason.trim());
      const extras = [
        r.cancelledAppointments > 0 &&
          `${r.cancelledAppointments} ${r.cancelledAppointments === 1 ? 'cita cancelada' : 'citas canceladas'}`,
        r.cancelledOrders > 0 &&
          `${r.cancelledOrders} ${r.cancelledOrders === 1 ? 'pedido cancelado' : 'pedidos cancelados'}`,
      ].filter(Boolean);
      showToast(
        `${client.firstName} ${client.lastName} fue dado de baja.${extras.length ? ` ${extras.join(' y ')}.` : ''}`,
        'success',
      );
      setReason('');
      onDone();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo dar de baja al cliente.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={client !== null}
      onClose={close}
      title={client ? `Dar de baja a ${client.firstName} ${client.lastName}` : ''}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={isSaving}>
            Cancelar
          </Button>
          <Button variant="danger" isLoading={isSaving} onClick={confirm} disabled={hasForbiddenChars || isSaving}>
            Dar de baja
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-sm">
        <ul className="space-y-2 text-text-muted">
          <li className="flex gap-2">
            <UserX className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--color-danger)]" aria-hidden="true" />
            Ya no podrá iniciar sesión y saldrá de la lista de clientes activos.
          </li>
          <li className="flex gap-2">
            <CalendarX className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--color-warning)]" aria-hidden="true" />
            Se cancelan sus citas de hoy en adelante y sus pedidos pendientes (el stock vuelve al inventario).
          </li>
          <li className="flex gap-2">
            <UserCheck className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--color-success)]" aria-hidden="true" />
            Su historial se conserva: mascotas, citas pasadas, pedidos y ventas. Puedes reactivarlo después.
          </li>
        </ul>
        <div>
          <label htmlFor="deactivation-reason" className="mb-1 block font-medium text-text">
            Motivo <span className="font-normal text-text-muted">(opcional)</span>
          </label>
          <textarea
            id="deactivation-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={300}
            rows={3}
            placeholder="Ej.: se mudó de ciudad, pidió cerrar su cuenta…"
            aria-invalid={hasForbiddenChars}
            aria-describedby="deactivation-reason-help"
            className={`focus-ring w-full rounded-lg border bg-surface px-3 py-2 text-sm text-text ${
              hasForbiddenChars ? 'border-[color:var(--color-danger)]' : 'border-border'
            }`}
          />
          <div id="deactivation-reason-help" className="mt-1 flex justify-between gap-3 text-xs">
            <span className={hasForbiddenChars ? 'text-[color:var(--color-danger)]' : 'text-text-muted'}>
              {hasForbiddenChars ? 'No se permiten los signos < ni >.' : 'Máximo 300 caracteres, solo texto.'}
            </span>
            <span className="text-text-muted">{reason.length}/300</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ¿Qué? Confirmación para devolverle el acceso a un cliente dado de baja.
function ReactivateClientDialog({
  client,
  onClose,
  onDone,
}: {
  client: ClientSummary | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const confirm = async () => {
    if (!client) return;
    setIsSaving(true);
    try {
      await staffApi.reactivateClient(client.id);
      showToast(`${client.firstName} ${client.lastName} fue reactivado y ya puede iniciar sesión.`, 'success');
      onDone();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo reactivar al cliente.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ConfirmDialog
      isOpen={client !== null}
      onClose={() => !isSaving && onClose()}
      onConfirm={confirm}
      title={client ? `Reactivar a ${client.firstName} ${client.lastName}` : ''}
      message="Podrá volver a iniciar sesión y aparecerá en la lista de clientes activos. Las citas y pedidos que se cancelaron al darlo de baja no se restauran."
      confirmLabel="Reactivar"
      tone="primary"
      isLoading={isSaving}
    />
  );
}

function ClientDetailModal({ client, onClose }: { client: ClientSummary | null; onClose: () => void }) {
  // ¿Qué? Caché de mascotas por cliente — `pets` se DERIVA de aquí (null = aún cargando).
  //   Así el efecto solo hace setState desde el callback async, nunca sincrónicamente.
  const [petsByClient, setPetsByClient] = useState<Record<string, Pet[]>>({});
  const pets = client ? (petsByClient[client.id] ?? null) : null;

  useEffect(() => {
    if (!client || petsByClient[client.id]) return;
    let active = true;
    petsApi
      .listPetsByClient(client.id)
      .then((p) => active && setPetsByClient((prev) => ({ ...prev, [client.id]: p })))
      .catch(() => active && setPetsByClient((prev) => ({ ...prev, [client.id]: [] })));
    return () => {
      active = false;
    };
  }, [client, petsByClient]);

  return (
    <Modal isOpen={client !== null} onClose={onClose} title={client ? `${client.firstName} ${client.lastName}` : ''} size="lg">
      {client && (
        <div className="space-y-5">
          <dl className="grid gap-3 sm:grid-cols-2">
            <Row icon={<Mail className="h-4 w-4" />} label="Correo" value={client.email} />
            <Row icon={<Phone className="h-4 w-4" />} label="Teléfono" value={client.phone ?? '—'} />
            <Row icon={<IdCard className="h-4 w-4" />} label="Documento" value={client.documentId ?? '—'} />
            <Row
              icon={<Users className="h-4 w-4" />}
              label="Cliente desde"
              value={
                client.createdAt
                  ? new Date(client.createdAt).toLocaleDateString('es-CO', { dateStyle: 'long' })
                  : '—'
              }
            />
          </dl>

          {client.deactivatedAt && (
            <div className="rounded-xl border border-[color:var(--color-danger)]/25 bg-[color:var(--color-accent-soft)] p-3 text-sm">
              <p className="flex items-center gap-2 font-medium text-[color:var(--color-danger)]">
                <UserX className="h-4 w-4" aria-hidden="true" />
                Dado de baja el {new Date(client.deactivatedAt).toLocaleDateString('es-CO', { dateStyle: 'long' })}
              </p>
              <p className="mt-1 text-text">
                Motivo: {client.deactivationReason ?? <span className="text-text-muted">sin motivo registrado</span>}
              </p>
            </div>
          )}

          <div>
            <p className="mb-2 font-display text-sm font-bold text-text">Mascotas registradas</p>
            {pets === null ? (
              <Skeleton className="h-14 w-full" lines={2} />
            ) : pets.length === 0 ? (
              <p className="text-sm text-text-muted">Este cliente todavía no tiene mascotas registradas.</p>
            ) : (
              <ul className="space-y-2">
                {pets.map((p) => (
                  <li key={p.id} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                    <PawPrint className="h-4 w-4 text-[color:var(--color-primary)]" aria-hidden="true" />
                    <span className="font-medium text-text">{p.name}</span>
                    <span className="text-xs text-text-muted">
                      {SPECIES_LABELS[p.species]}
                      {p.breed ? ` · ${p.breed}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-text-muted">{icon}</span>
      <div>
        <dt className="text-xs text-text-muted">{label}</dt>
        <dd className="text-sm text-text">{value}</dd>
      </div>
    </div>
  );
}
