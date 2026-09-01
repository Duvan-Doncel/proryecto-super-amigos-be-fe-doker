/**
 * Archivo: pages/staff/StaffServicesPage.tsx
 * Descripción: Catálogo de servicios de grooming (RF-014, HU-014).
 * ¿Para qué? El staff crea y edita servicios y precios — sin un servicio activo,
 *   los clientes no pueden agendar citas (RF-009).
 * ¿Impacto? "Eliminar" desactiva el servicio si ya tiene citas asociadas (RN-143),
 *   en vez de borrarlo, para no perder el historial.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as servicesApi from '@/api/services';
import type { Service } from '@/types/services';
import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/InputField';
import { Alert } from '@/components/ui/Alert';

interface FormData {
  name: string;
  description: string;
  price: string;
  durationMinutes: string;
}

const EMPTY_FORM: FormData = { name: '', description: '', price: '', durationMinutes: '' };

export function StaffServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadServices = () => servicesApi.listServicesForStaff(false).then(setServices);

  useEffect(() => {
    loadServices();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      await servicesApi.createService({
        name: formData.name,
        description: formData.description || undefined,
        price: Number(formData.price),
        durationMinutes: Number(formData.durationMinutes),
      });
      setSuccess(true);
      setFormData(EMPTY_FORM);
      loadServices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el servicio.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleActive = async (service: Service) => {
    setBusyId(service.id);
    setError(null);
    try {
      await servicesApi.updateService(service.id, { active: !service.active });
      loadServices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el servicio.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (service: Service) => {
    setBusyId(service.id);
    setError(null);
    try {
      await servicesApi.deleteService(service.id);
      loadServices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el servicio.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <Link to="/staff" className="text-sm text-gray-500 dark:text-slate-400 hover:underline">
        ← Volver
      </Link>

      <h1 className="text-2xl font-comic tracking-wide text-gray-900 dark:text-slate-100 mt-4 mb-6">
        ✂️ Catálogo de Servicios
      </h1>

      {success && (
        <div className="mb-4">
          <Alert type="success" message="Servicio creado correctamente." />
        </div>
      )}
      {error && (
        <div className="mb-4">
          <Alert type="error" message={error} />
        </div>
      )}

      <p className="mb-4 text-sm text-gray-500 dark:text-slate-400">
        El precio de aquí es el <strong>precio base</strong> (mascota pequeña, pelo corto, sin
        condiciones). Los recargos por tamaño, pelo y piel se ajustan en el{' '}
        <Link to="/staff/tarifario" className="text-brand-600 dark:text-brand-400 hover:underline">
          tarifario de grooming
        </Link>
        .
      </p>

      <form onSubmit={handleSubmit} noValidate className="space-y-4 mb-10">
        <InputField
          id="name"
          name="name"
          label="Nombre del servicio"
          required
          value={formData.name}
          onChange={handleChange}
          placeholder="Ej: Baño y corte"
        />
        <InputField
          id="description"
          name="description"
          label="Descripción (opcional)"
          value={formData.description}
          onChange={handleChange}
        />
        <InputField
          id="price"
          name="price"
          label="Precio (COP)"
          type="number"
          min={1}
          required
          value={formData.price}
          onChange={handleChange}
        />
        <InputField
          id="durationMinutes"
          name="durationMinutes"
          label="Duración (minutos)"
          type="number"
          min={1}
          required
          value={formData.durationMinutes}
          onChange={handleChange}
        />

        <div className="flex justify-end pt-2">
          <Button type="submit" isLoading={isSubmitting}>Crear servicio</Button>
        </div>
      </form>

      <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-3">Servicios existentes</h2>
      {services.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-slate-400">Todavía no hay servicios registrados.</p>
      ) : (
        <ul className="space-y-2">
          {services.map((s) => (
            <li
              key={s.id}
              className={`rounded-lg border px-4 py-3 text-sm ${
                s.active
                  ? 'border-gray-200 dark:border-slate-700'
                  : 'border-gray-200 dark:border-slate-700 opacity-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900 dark:text-slate-100">
                  {s.name} — desde ${s.price.toLocaleString('es-CO')} ({s.durationMinutes} min)
                </span>
                <span className="text-xs text-gray-500 dark:text-slate-400">
                  {s.active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div className="flex gap-2 mt-2">
                <Button
                  variant="secondary"
                  className="text-xs px-3 py-1.5"
                  isLoading={busyId === s.id}
                  onClick={() => toggleActive(s)}
                >
                  {s.active ? 'Desactivar' : 'Activar'}
                </Button>
                <Button
                  variant="danger"
                  className="text-xs px-3 py-1.5"
                  isLoading={busyId === s.id}
                  onClick={() => handleDelete(s)}
                >
                  Eliminar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
