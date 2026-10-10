/**
 * Archivo: pages/staff/StaffSuppliersPage.tsx
 * Descripción: Gestión de proveedores (RF-020, HU-020).
 * ¿Para qué? Sin proveedores registrados no se puede generar un pedido de
 *   reabastecimiento (RF-021). Se crea/edita en un pop-up y se elimina con confirmación.
 * ¿Impacto? "Eliminar" desactiva el proveedor si ya tiene pedidos asociados (RN-202).
 */

import { useEffect, useMemo, useState } from 'react';
import { Boxes, Plus } from 'lucide-react';
import * as suppliersApi from '@/api/suppliers';
import type { Supplier } from '@/types/suppliers';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { usePagination } from '@/hooks/usePagination';
import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/InputField';
import { Alert } from '@/components/ui/Alert';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FilterBar } from '@/components/ui/FilterBar';
import { SelectField } from '@/components/ui/SelectField';
import { rowNumber } from '@/utils/tablePaging';
import { useToast } from '@/hooks/useToast';

interface FormData {
  name: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
}

const EMPTY_FORM: FormData = { name: '', contactName: '', phone: '', email: '', address: '' };

export function StaffSuppliersPage() {
  const { showToast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Supplier | null>(null);

  const loadSuppliers = () =>
    suppliersApi
      .listSuppliers()
      .then(setSuppliers)
      .finally(() => setIsLoading(false));

  useEffect(() => {
    loadSuppliers();
  }, []);

  const active = useMemo(() => suppliers.filter((s) => s.active).length, [suppliers]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | 'active' | 'inactive'>('');
  const hasActiveFilters = search !== '' || statusFilter !== '';

  const filtered = useMemo(() => {
    return suppliers.filter((s) => {
      if (statusFilter === 'active' && !s.active) return false;
      if (statusFilter === 'inactive' && s.active) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (![s.name, s.contactName, s.email].filter(Boolean).some((v) => v!.toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [suppliers, search, statusFilter]);

  const { pageItems, page, setPage, pageSize, setPageSize, pageCount, total } = usePagination(filtered, 10);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    try {
      await suppliersApi.createSupplier({
        name: formData.name,
        contactName: formData.contactName || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        address: formData.address || undefined,
      });
      showToast('Proveedor creado.', 'success');
      setFormData(EMPTY_FORM);
      setFormOpen(false);
      loadSuppliers();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo crear el proveedor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleActive = async (supplier: Supplier) => {
    setBusyId(supplier.id);
    try {
      await suppliersApi.updateSupplier(supplier.id, { active: !supplier.active });
      showToast(supplier.active ? 'Proveedor desactivado.' : 'Proveedor activado.', 'success');
      loadSuppliers();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo actualizar.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setBusyId(toDelete.id);
    try {
      await suppliersApi.deleteSupplier(toDelete.id);
      showToast('Proveedor eliminado.', 'success');
      setToDelete(null);
      loadSuppliers();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo eliminar.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Proveedores"
        description="Con quién reabasteces el inventario. Necesario para generar pedidos de compra."
        actions={
          <Button onClick={() => { setFormData(EMPTY_FORM); setFormError(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Nuevo proveedor
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Proveedores (total)" value={suppliers.length} icon={<Boxes className="h-4 w-4" />} accent="brand" />
        <StatCard label="Activos" value={active} accent="success" />
        <StatCard label="Inactivos" value={suppliers.length - active} accent="neutral" />
      </div>

      <FilterBar
        onClear={() => {
          setSearch('');
          setStatusFilter('');
        }}
        hasActiveFilters={hasActiveFilters}
      >
        <div className="w-56">
          <InputField id="supplier-search" label="Buscar" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nombre, contacto o email" />
        </div>
        <div className="w-40">
          <SelectField id="supplier-status" label="Estado" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as '' | 'active' | 'inactive')}>
            <option value="">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </SelectField>
        </div>
      </FilterBar>

      <DataTable
        head={
          <>
            <th>#</th>
            <th>Proveedor</th>
            <th>Contacto</th>
            <th>Estado</th>
            <th className="text-right">Acciones</th>
          </>
        }
        isLoading={isLoading}
        isEmpty={!isLoading && total === 0}
        emptyTitle={hasActiveFilters ? 'Sin resultados con estos filtros' : 'Todavía no hay proveedores'}
        emptyAction={!hasActiveFilters ? <Button onClick={() => setFormOpen(true)}>Crear el primero</Button> : undefined}
      >
        {pageItems.map((s, i) => (
          <tr key={s.id} className={s.active ? '' : 'opacity-60'}>
            <td className="text-text-muted">{rowNumber(page, pageSize, i)}</td>
            <td className="font-medium text-text">{s.name}</td>
            <td className="text-text-muted">
              {[s.contactName, s.phone, s.email].filter(Boolean).join(' · ') || '—'}
            </td>
            <td>
              <span className={s.active ? 'text-[color:var(--color-success)]' : 'text-text-muted'}>
                {s.active ? 'Activo' : 'Inactivo'}
              </span>
            </td>
            <td className="text-right">
              <div className="inline-flex gap-2">
                <Button
                  variant="secondary"
                  className="px-3 py-1.5 text-xs"
                  isLoading={busyId === s.id}
                  onClick={() => toggleActive(s)}
                >
                  {s.active ? 'Desactivar' : 'Activar'}
                </Button>
                <Button variant="danger" className="px-3 py-1.5 text-xs" onClick={() => setToDelete(s)}>
                  Eliminar
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>

      <Pagination
        page={page}
        pageCount={pageCount}
        total={total}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        itemNoun="proveedores"
      />

      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title="Nuevo proveedor"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button form="supplier-form" type="submit" isLoading={isSubmitting}>
              Crear proveedor
            </Button>
          </>
        }
      >
        <form id="supplier-form" onSubmit={handleSubmit} noValidate className="space-y-4">
          {formError && <Alert type="error" message={formError} />}
          <InputField id="name" name="name" label="Nombre del proveedor" required value={formData.name} onChange={handleChange} maxLength={150} placeholder="Ej: Distribuidora Mascotas SAS" />
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField id="contactName" name="contactName" label="Nombre de contacto (opcional)" value={formData.contactName} onChange={handleChange} maxLength={150} />
            <InputField id="phone" name="phone" label="Teléfono (opcional)" value={formData.phone} onChange={handleChange} maxLength={30} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField id="email" name="email" label="Email (opcional)" type="email" value={formData.email} onChange={handleChange} maxLength={255} />
            <InputField id="address" name="address" label="Dirección (opcional)" value={formData.address} onChange={handleChange} maxLength={300} />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title="Eliminar proveedor"
        message={`¿Eliminar a "${toDelete?.name}"? Si ya tiene pedidos asociados, se desactivará en vez de borrarse.`}
        confirmLabel="Eliminar"
        isLoading={busyId === toDelete?.id}
      />
    </div>
  );
}
