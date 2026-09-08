/**
 * Archivo: pages/client/SymptomReportPage.tsx
 * Descripción: Reportar síntoma leve (RF-010, HU-010) y ver "Mis reportes" con su recomendación.
 * ¿Impacto? No pide diagnóstico ni tratamiento — GroomingSpa no tiene veterinario
 *   profesional en planta, solo una auxiliar que revisa y recomienda (ver límite de RF-010).
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as petsApi from '@/api/pets';
import * as reportsApi from '@/api/symptom-reports';
import type { Pet } from '@/types/pets';
import type { SymptomReport } from '@/types/symptom-reports';
import { Button } from '@/components/ui/Button';
import { SelectField } from '@/components/ui/SelectField';
import { InputField } from '@/components/ui/InputField';
import { Alert } from '@/components/ui/Alert';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface FormData {
  petId: string;
  symptom: string;
  daysWithSymptom: string;
}

export function SymptomReportPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [reports, setReports] = useState<SymptomReport[]>([]);
  const [formData, setFormData] = useState<FormData>({ petId: '', symptom: '', daysWithSymptom: '' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadReports = () => reportsApi.listMyReports().then(setReports);

  useEffect(() => {
    petsApi.listMyPets().then(setPets);
    loadReports();
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
      await reportsApi.createSymptomReport({
        petId: formData.petId,
        symptom: formData.symptom,
        daysWithSymptom: Number(formData.daysWithSymptom),
      });
      setSuccess(true);
      setFormData({ petId: '', symptom: '', daysWithSymptom: '' });
      await loadReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar el reporte.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <Link to="/app" className="text-sm text-text-muted hover:underline">
        ← Volver
      </Link>

      <h1 className="text-2xl font-display tracking-wide text-text mt-4 mb-6">
        🟡 Reportar Síntoma Leve
      </h1>

      {success && (
        <div className="mb-4">
          <Alert type="success" message="Reporte enviado. Alguien del staff lo revisará pronto." />
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

        <InputField
          id="symptom"
          name="symptom"
          label="¿Qué síntomas tiene?"
          type="text"
          required
          value={formData.symptom}
          onChange={handleChange}
          placeholder="Ej: No quiere comer, está decaído"
          maxLength={500}
        />

        <InputField
          id="daysWithSymptom"
          name="daysWithSymptom"
          label="¿Hace cuántos días?"
          type="number"
          min={1}
          required
          value={formData.daysWithSymptom}
          onChange={handleChange}
          placeholder="Ej: 2"
        />

        <div className="flex justify-end pt-2">
          <Button type="submit" isLoading={isLoading}>
            Enviar reporte 💊
          </Button>
        </div>
      </form>

      <h2 className="text-lg font-semibold text-text mb-3">Mis reportes</h2>
      {reports.length === 0 ? (
        <p className="text-sm text-text-muted">Todavía no has enviado reportes.</p>
      ) : (
        <ul className="space-y-3">
          {reports.map((r) => {
            const pet = pets.find((p) => p.id === r.petId);
            return (
              <li key={r.id} className="rounded-lg border border-border px-4 py-3 text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-text">
                    {pet?.name ?? 'Mascota'} — {r.symptom}
                  </span>
                  <StatusBadge status={r.status} />
                </div>
                <p className="text-text-muted">Hace {r.daysWithSymptom} día(s)</p>
                {r.recommendation && (
                  <p className="mt-2 text-green-700 dark:text-green-400">
                    <strong>Recomendación:</strong> {r.recommendation}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
