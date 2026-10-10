/**
 * Archivo: pages/staff/StaffClientsPage.tsx
 * Descripción: Directorio de clientes del negocio (apoyo a RF-012).
 * ¿Para qué? Ver de un vistazo quiénes son los clientes, cuántas mascotas tiene cada uno
 *   y desde cuándo, con búsqueda y paginación reales contra el backend. Al abrir un cliente
 *   se ven sus mascotas registradas sin salir de la pantalla.
 */

import { useEffect, useMemo, useState } from 'react';
import { Users, Search, PawPrint, Mail, Phone, IdCard } from 'lucide-react';
import * as staffApi from '@/api/staff';
import * as petsApi from '@/api/pets';
import type { ClientSummary, ClientsMeta } from '@/types/staff';
import type { Pet } from '@/types/pets';
import { SPECIES_LABELS } from '@/types/pricing';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { FilterBar } from '@/components/ui/FilterBar';
import { SelectField } from '@/components/ui/SelectField';
import { rowNumber } from '@/utils/tablePaging';

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

  useEffect(() => {
    let active = true;
    // ¿Qué? Marca "cargando" antes de la petición. Es el patrón estándar de fetch en efecto
    //   (mismo que ShopPage); el `active` de arriba evita el setState tras desmontar.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    staffApi
      .listClients({ page, limit: pageSize, q: search || undefined, hasPets: hasPets || undefined })
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
  }, [page, pageSize, search, hasPets]);

  const hasActiveFilters = search !== '' || hasPets !== '';
  const clearFilters = () => {
    setSearchInput('');
    setSearch('');
    setHasPets('');
    setPage(1);
  };

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
        <StatCard label="Clientes (total)" value={meta?.total ?? '—'} icon={<Users className="h-4 w-4" />} accent="brand" />
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
        emptyTitle={hasActiveFilters ? 'Sin resultados con estos filtros' : 'Aún no hay clientes'}
      >
        {clients.map((c, i) => (
          <tr key={c.id}>
            <td className="text-text-muted">{rowNumber(meta?.page ?? page, pageSize, i)}</td>
            <td className="font-medium text-text">
              {c.firstName} {c.lastName}
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
              <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => setSelected(c)}>
                Ver ficha
              </Button>
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
    </div>
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
