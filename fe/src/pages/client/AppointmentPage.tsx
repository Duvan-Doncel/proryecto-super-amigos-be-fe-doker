/**
 * Archivo: pages/client/AppointmentPage.tsx
 * Descripción: Agendar cita de grooming (RF-009, HU-009) y ver "Mis citas".
 * ¿Para qué? La mascota y el servicio se eligen de listas ya existentes — nunca texto
 *   libre (RN-091, RN-093) — evitando citas para mascotas de otro cliente o servicios inactivos.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as petsApi from '@/api/pets';
import * as servicesApi from '@/api/services';
import * as appointmentsApi from '@/api/appointments';
import type { Pet } from '@/types/pets';
import type { Service } from '@/types/services';
import type { Appointment } from '@/types/appointments';
import { Button } from '@/components/ui/Button';
import { SelectField } from '@/components/ui/SelectField';
import { InputField } from '@/components/ui/InputField';
import { Alert } from '@/components/ui/Alert';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface FormData {
  petId: string;
  serviceId: string;
  date: string;
  time: string;
}

// ¿Qué? Fecha mínima seleccionable en el date picker — mañana (RN-092).
function tomorrowIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function AppointmentPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [formData, setFormData] = useState<FormData>({ petId: '', serviceId: '', date: '', time: '' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadAppointments = () => appointmentsApi.listMyAppointments().then(setAppointments);

  useEffect(() => {
    petsApi.listMyPets().then(setPets);
    servicesApi.listServices().then(setServices);
    loadAppointments();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await appointmentsApi.createAppointment(formData);
      setSuccess(true);
      setFormData({ petId: '', serviceId: '', date: '', time: '' });
      await loadAppointments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo agendar la cita.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <Link to="/app" className="text-sm text-gray-500 dark:text-slate-400 hover:underline">
        ← Volver
      </Link>

      <h1 className="text-2xl font-comic tracking-wide text-gray-900 dark:text-slate-100 mt-4 mb-6">
        🟢 Agendar Cita de Grooming
      </h1>

      {success && (
        <div className="mb-4">
          <Alert type="success" message="¡Cita agendada! Te contactaremos para confirmarla." />
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4 mb-10">
        {error && <Alert type="error" message={error} />}

        <SelectField
          id="petId"
          name="petId"
          label="Mascota"
          required
          value={formData.petId}
          onChange={handleChange}
        >
          <option value="" disabled>Selecciona tu mascota</option>
          {pets.map((pet) => (
            <option key={pet.id} value={pet.id}>{pet.name}</option>
          ))}
        </SelectField>

        <SelectField
          id="serviceId"
          name="serviceId"
          label="Servicio"
          required
          value={formData.serviceId}
          onChange={handleChange}
        >
          <option value="" disabled>Selecciona un servicio</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name} — ${service.price.toLocaleString('es-CO')}
            </option>
          ))}
        </SelectField>

        <InputField
          id="date"
          name="date"
          label="Fecha"
          type="date"
          required
          min={tomorrowIso()}
          value={formData.date}
          onChange={handleChange}
        />

        <InputField
          id="time"
          name="time"
          label="Hora (entre 9:00am y 6:00pm)"
          type="time"
          required
          min="09:00"
          max="18:00"
          value={formData.time}
          onChange={handleChange}
        />

        <div className="flex justify-end pt-2">
          <Button type="submit" isLoading={isLoading}>
            Agendar cita 🐾
          </Button>
        </div>
      </form>

      <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-3">Mis citas</h2>
      {appointments.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-slate-400">Todavía no tienes citas agendadas.</p>
      ) : (
        <ul className="space-y-2">
          {appointments.map((a) => {
            const pet = pets.find((p) => p.id === a.petId);
            const service = services.find((s) => s.id === a.serviceId);
            return (
              <li
                key={a.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-slate-700 px-4 py-3 text-sm"
              >
                <span>
                  {a.date} — {a.time} — {service?.name ?? 'Servicio'} ({pet?.name ?? 'Mascota'})
                </span>
                <StatusBadge status={a.status} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
