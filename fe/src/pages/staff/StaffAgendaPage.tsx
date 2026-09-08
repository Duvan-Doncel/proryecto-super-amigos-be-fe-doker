/**
 * Archivo: pages/staff/StaffAgendaPage.tsx
 * Descripción: Calendario del día para el staff (RF-017, HU-017).
 * ¿Para qué? Ver las citas de grooming del día y avanzar su estado
 *   (pendiente → confirmada → completada, o cancelada) a medida que se atienden.
 * ¿Impacto? Un estado final (completada/cancelada) no puede volver a moverse (RN-097).
 */

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, PawPrint } from 'lucide-react';
import * as appointmentsApi from '@/api/appointments';
import type { AgendaAppointment, AppointmentStatus } from '@/types/appointments';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { usePagination } from '@/hooks/usePagination';
import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/InputField';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/hooks/useToast';

const todayIso = () => new Date().toISOString().slice(0, 10);

const NEXT_STATUS: Partial<Record<AppointmentStatus, AppointmentStatus>> = {
  pending: 'confirmed',
  confirmed: 'completed',
};
const NEXT_LABEL: Partial<Record<AppointmentStatus, string>> = {
  pending: 'Confirmar',
  confirmed: 'Marcar completada',
};

export function StaffAgendaPage() {
  const { showToast } = useToast();
  const [date, setDate] = useState(todayIso());
  const [appointments, setAppointments] = useState<AgendaAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toCancel, setToCancel] = useState<AgendaAppointment | null>(null);

  const loadAgenda = (d: string) => {
    setIsLoading(true);
    appointmentsApi
      .getAgenda(d)
      .then(setAppointments)
      .catch((err) => showToast(err instanceof Error ? err.message : 'No se pudo cargar la agenda.', 'error'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadAgenda(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = useMemo(
    () => ({
      pending: appointments.filter((a) => a.status === 'pending').length,
      confirmed: appointments.filter((a) => a.status === 'confirmed').length,
      completed: appointments.filter((a) => a.status === 'completed').length,
    }),
    [appointments],
  );
  const { pageItems, page, setPage, pageSize, setPageSize, pageCount, total } = usePagination(appointments, 12);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
    loadAgenda(e.target.value);
  };

  const changeStatus = async (id: string, status: AppointmentStatus) => {
    setUpdatingId(id);
    try {
      await appointmentsApi.updateAppointmentStatus(id, status);
      showToast('Cita actualizada.', 'success');
      setToCancel(null);
      loadAgenda(date);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo actualizar la cita.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Agenda del día"
        description="Citas de grooming del día. Confirma, completa o cancela a medida que atiendes."
        actions={
          <div className="w-44">
            <InputField id="date" name="date" label="Fecha" type="date" value={date} onChange={handleDateChange} />
          </div>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <StatCard label="Citas" value={total} icon={<CalendarDays className="h-4 w-4" />} accent="brand" />
        <StatCard label="Sin confirmar" value={counts.pending} accent={counts.pending > 0 ? 'warning' : 'success'} />
        <StatCard label="Confirmadas" value={counts.confirmed} accent="brand" />
        <StatCard label="Completadas" value={counts.completed} accent="success" />
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full" lines={2} />
      ) : appointments.length === 0 ? (
        <EmptyState icon={<CalendarDays className="h-6 w-6" />} title="Sin citas para este día" />
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {pageItems.map((a) => {
              const nextStatus = NEXT_STATUS[a.status];
              const isFinal = a.status === 'completed' || a.status === 'cancelled';
              return (
                <Card key={a.id} padded={false}>
                  <div className="p-4 text-sm">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-medium text-text">
                        <span className="tabular-nums">{a.time}</span> · {a.service.name}
                      </span>
                      <StatusBadge status={a.status} />
                    </div>
                    <p className="flex items-center gap-1.5 text-text-muted">
                      <PawPrint className="h-3.5 w-3.5" aria-hidden="true" />
                      {a.pet.name} · {a.client.firstName} {a.client.lastName}
                      {a.client.phone ? ` · ${a.client.phone}` : ''}
                    </p>
                    {!isFinal && (
                      <div className="mt-3 flex gap-2">
                        {nextStatus && (
                          <Button
                            className="px-3 py-1.5 text-xs"
                            isLoading={updatingId === a.id}
                            onClick={() => changeStatus(a.id, nextStatus)}
                          >
                            {NEXT_LABEL[a.status]}
                          </Button>
                        )}
                        <Button variant="danger" className="px-3 py-1.5 text-xs" onClick={() => setToCancel(a)}>
                          Cancelar
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </ul>
          <Pagination
            page={page}
            pageCount={pageCount}
            total={total}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            itemNoun="citas"
          />
        </>
      )}

      <ConfirmDialog
        isOpen={toCancel !== null}
        onClose={() => setToCancel(null)}
        onConfirm={() => toCancel && changeStatus(toCancel.id, 'cancelled')}
        title="Cancelar cita"
        message={`¿Cancelar la cita de ${toCancel?.time} (${toCancel?.pet.name} · ${toCancel?.client.firstName})?`}
        confirmLabel="Cancelar cita"
        cancelLabel="Volver"
        isLoading={updatingId === toCancel?.id}
      />
    </div>
  );
}
