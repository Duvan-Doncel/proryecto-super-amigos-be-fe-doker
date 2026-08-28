/**
 * Archivo: pages/staff/StaffAgendaPage.tsx
 * Descripción: Calendario del día para el staff (RF-017, HU-017).
 * ¿Para qué? Ver de un vistazo las citas de grooming del día y avanzar su estado
 *   (pendiente → confirmada → completada, o cancelada) a medida que se atienden.
 * ¿Impacto? Un estado final (completada/cancelada) no puede volver a moverse (RN-097),
 *   por lo que esos botones se ocultan una vez la cita llega a ese estado.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as appointmentsApi from '@/api/appointments';
import type { AgendaAppointment, AppointmentStatus } from '@/types/appointments';
import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/InputField';
import { Alert } from '@/components/ui/Alert';
import { StatusBadge } from '@/components/ui/StatusBadge';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// ¿Qué? Próximo estado sugerido según el estado actual — el flujo normal de una cita.
const NEXT_STATUS: Partial<Record<AppointmentStatus, AppointmentStatus>> = {
  pending: 'confirmed',
  confirmed: 'completed',
};

const NEXT_LABEL: Partial<Record<AppointmentStatus, string>> = {
  pending: 'Confirmar',
  confirmed: 'Marcar completada',
};

export function StaffAgendaPage() {
  const [date, setDate] = useState(todayIso());
  const [appointments, setAppointments] = useState<AgendaAppointment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadAgenda = (d: string) => {
    setIsLoading(true);
    setError(null);
    appointmentsApi
      .getAgenda(d)
      .then(setAppointments)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar la agenda.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadAgenda(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
    loadAgenda(e.target.value);
  };

  const handleStatusChange = async (id: string, status: AppointmentStatus) => {
    setUpdatingId(id);
    setError(null);
    try {
      await appointmentsApi.updateAppointmentStatus(id, status);
      loadAgenda(date);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la cita.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link to="/staff" className="text-sm text-gray-500 dark:text-slate-400 hover:underline">
        ← Volver
      </Link>

      <h1 className="text-2xl font-comic tracking-wide text-gray-900 dark:text-slate-100 mt-4 mb-6">
        📅 Agenda del día
      </h1>

      <div className="mb-6 max-w-xs">
        <InputField id="date" name="date" label="Fecha" type="date" value={date} onChange={handleDateChange} />
      </div>

      {error && (
        <div className="mb-4">
          <Alert type="error" message={error} />
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-500 dark:text-slate-400">Cargando...</p>
      ) : appointments.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-slate-400">No hay citas agendadas para este día.</p>
      ) : (
        <ul className="space-y-3">
          {appointments.map((a) => {
            const nextStatus = NEXT_STATUS[a.status];
            const isFinal = a.status === 'completed' || a.status === 'cancelled';
            return (
              <li key={a.id} className="rounded-lg border border-gray-200 dark:border-slate-700 px-4 py-3 text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900 dark:text-slate-100">
                    {a.time} — {a.service.name}
                  </span>
                  <StatusBadge status={a.status} />
                </div>
                <p className="text-gray-500 dark:text-slate-400 mb-1">
                  🐾 {a.pet.name} — {a.client.firstName} {a.client.lastName}
                  {a.client.phone ? ` — ${a.client.phone}` : ''}
                </p>

                {!isFinal && (
                  <div className="flex gap-2 mt-2">
                    {nextStatus && (
                      <Button
                        variant="primary"
                        className="text-xs px-3 py-1.5"
                        isLoading={updatingId === a.id}
                        onClick={() => handleStatusChange(a.id, nextStatus)}
                      >
                        {NEXT_LABEL[a.status]}
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      className="text-xs px-3 py-1.5"
                      isLoading={updatingId === a.id}
                      onClick={() => handleStatusChange(a.id, 'cancelled')}
                    >
                      Cancelar
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
