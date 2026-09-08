/**
 * Archivo: pages/staff/StaffServicesPage.tsx
 * Descripción: Catálogo de servicios de grooming (RF-014, HU-014).
 * ¿Para qué? El staff crea y edita servicios y su precio base — sin un servicio activo,
 *   los clientes no pueden agendar citas (RF-009). Alta en pop-up; baja con confirmación.
 * ¿Impacto? "Eliminar" desactiva el servicio si ya tiene citas asociadas (RN-143).
 */

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Scissors, Plus } from 'lucide-react';
import * as servicesApi from '@/api/services';
import type { Service } from '@/types/services';
import { formatCOP } from '@/types/pricing';
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
import { useToast } from '@/hooks/useToast';

interface FormData {
  name: string;
  description: string;
  price: string;
  durationMinutes: string;
}

const EMPTY_FORM: FormData = { name: '', description: '', price: '', durationMinutes: '' };

export function StaffServicesPage() {
  const { showToast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Service | null>(null);

  const loadServices = () =>
    servicesApi
      .listServicesForStaff(false)
      .then(setServices)
      .finally(() => setIsLoading(false));

  useEffect(() => {
    loadServices();
  }, []);

  const active = useMemo(() => services.filter((s) => s.active).length, [services]);
  const { pageItems, page, setPage, pageSize, setPageSize, pageCount, total } = usePagination(services, 10);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    try {
      await servicesApi.createService({
        name: formData.name,
        description: formData.description || undefined,
        price: Number(formData.price),
        durationMinutes: Number(formData.durationMinutes),
      });
      showToast('Servicio creado.', 'success');
      setFormData(EMPTY_FORM);
      setFormOpen(false);
      loadServices();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo crear el servicio.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleActive = async (service: Service) => {
    setBusyId(service.id);
    try {
      await servicesApi.updateService(service.id, { active: !service.active });
      showToast(service.active ? 'Servicio desactivado.' : 'Servicio activado.', 'success');
      loadServices();
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
      await servicesApi.deleteService(toDelete.id);
      showToast('Servicio eliminado.', 'success');
      setToDelete(null);
      loadServices();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo eliminar.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Catálogo de servicios"
        description="Servicios de grooming y su precio base (mascota pequeña, pelo corto, sin condiciones)."
        actions={
          <Button onClick={() => { setFormData(EMPTY_FORM); setFormError(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Nuevo servicio
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Servicios (total)" value={total} icon={<Scissors className="h-4 w-4" />} accent="brand" />
        <StatCard label="Activos" value={active} accent="success" />
        <StatCard label="Inactivos" value={total - active} accent="neutral" />
      </div>

      <p className="mb-4 text-sm text-text-muted">
        Los recargos por tamaño, pelo y piel se ajustan en el{' '}
        <Link to="/staff/tarifario" className="text-[color:var(--color-primary)] hover:underline">
          tarifario de grooming
        </Link>
        .
      </p>

      <DataTable
        head={
          <>
            <th>Servicio</th>
            <th>Precio base</th>
            <th>Duración</th>
            <th>Estado</th>
            <th className="text-right">Acciones</th>
          </>
        }
        isLoading={isLoading}
        isEmpty={!isLoading && services.length === 0}
        emptyTitle="Todavía no hay servicios"
        emptyAction={<Button onClick={() => setFormOpen(true)}>Crear el primero</Button>}
      >
        {pageItems.map((s) => (
          <tr key={s.id} className={s.active ? '' : 'opacity-60'}>
            <td className="font-medium text-text">{s.name}</td>
            <td className="tabular-nums text-text">{formatCOP(s.price)}</td>
            <td className="text-text-muted">{s.durationMinutes} min</td>
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
        itemNoun="servicios"
      />

      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title="Nuevo servicio"
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button form="service-form" type="submit" isLoading={isSubmitting}>
              Crear servicio
            </Button>
          </>
        }
      >
        <form id="service-form" onSubmit={handleSubmit} noValidate className="space-y-4">
          {formError && <Alert type="error" message={formError} />}
          <InputField id="name" name="name" label="Nombre del servicio" required value={formData.name} onChange={handleChange} maxLength={150} placeholder="Ej: Baño y corte" />
          <InputField id="description" name="description" label="Descripción (opcional)" value={formData.description} onChange={handleChange} maxLength={1000} />
          <div className="grid grid-cols-2 gap-4">
            <InputField id="price" name="price" label="Precio base (COP)" type="number" min={1} required value={formData.price} onChange={handleChange} />
            <InputField id="durationMinutes" name="durationMinutes" label="Duración (minutos)" type="number" min={1} required value={formData.durationMinutes} onChange={handleChange} />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title="Eliminar servicio"
        message={`¿Eliminar "${toDelete?.name}"? Si ya tiene citas asociadas, se desactivará en vez de borrarse.`}
        confirmLabel="Eliminar"
        isLoading={busyId === toDelete?.id}
      />
    </div>
  );
}
