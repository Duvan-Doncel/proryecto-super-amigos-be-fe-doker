/**
 * Archivo: pages/staff/StaffSymptomsPage.tsx
 * Descripción: Bandeja de reportes de síntomas pendientes (RF-018, HU-018).
 * ¿Para qué? Cierra el flujo de la opción 🟡 del semáforo — la auxiliar revisa el
 *   reporte del cliente y deja una recomendación de texto libre.
 * ¿Impacto? Nunca pide diagnóstico ni medicamento (RN-182) — solo un campo de texto.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as reportsApi from '@/api/symptom-reports';
import type { PendingSymptomReport } from '@/types/symptom-reports';
import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/InputField';
import { Alert } from '@/components/ui/Alert';

export function StaffSymptomsPage() {
  const [reports, setReports] = useState<PendingSymptomReport[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const loadReports = () => {
    setIsLoading(true);
    reportsApi
      .listPendingReports()
      .then(setReports)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudieron cargar los reportes.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleReview = async (id: string) => {
    const recommendation = (drafts[id] ?? '').trim();
    if (!recommendation) {
      setError('Escribe una recomendación antes de enviar.');
      return;
    }
    setSubmittingId(id);
    setError(null);
    try {
      await reportsApi.reviewReport(id, recommendation);
      loadReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar la recomendación.');
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link to="/staff" className="text-sm text-gray-500 dark:text-slate-400 hover:underline">
        ← Volver
      </Link>

      <h1 className="text-2xl font-comic tracking-wide text-gray-900 dark:text-slate-100 mt-4 mb-6">
        💊 Reportes de Síntomas Pendientes
      </h1>

      {error && (
        <div className="mb-4">
          <Alert type="error" message={error} />
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-500 dark:text-slate-400">Cargando...</p>
      ) : reports.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-slate-400">No hay reportes pendientes por revisar.</p>
      ) : (
        <ul className="space-y-4">
          {reports.map((r) => (
            <li key={r.id} className="rounded-lg border border-gray-200 dark:border-slate-700 px-4 py-3 text-sm">
              <p className="font-medium text-gray-900 dark:text-slate-100 mb-1">
                🐾 {r.pet.name} ({r.pet.species}) — {r.client.firstName} {r.client.lastName}
                {r.client.phone ? ` — ${r.client.phone}` : ''}
              </p>
              <p className="text-gray-700 dark:text-slate-300 mb-1">
                <strong>Síntoma:</strong> {r.symptom} (hace {r.daysWithSymptom} día(s))
              </p>
              {r.notes && (
                <p className="text-gray-500 dark:text-slate-400 mb-2">Notas: {r.notes}</p>
              )}

              <div className="flex gap-2 mt-2">
                <div className="flex-1">
                  <InputField
                    id={`recommendation-${r.id}`}
                    name={`recommendation-${r.id}`}
                    label="Recomendación"
                    value={drafts[r.id] ?? ''}
                    onChange={(e) => setDrafts((prev) => ({ ...prev, [r.id]: e.target.value }))}
                    placeholder="Ej: Tráela mañana para revisarla en persona."
                  />
                </div>
                <div className="pt-7">
                  <Button
                    isLoading={submittingId === r.id}
                    onClick={() => handleReview(r.id)}
                  >
                    Enviar
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
