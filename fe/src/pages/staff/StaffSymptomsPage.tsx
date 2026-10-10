/**
 * Archivo: pages/staff/StaffSymptomsPage.tsx
 * Descripción: Bandeja de reportes de síntomas pendientes (RF-018, HU-018).
 * ¿Para qué? Cierra el flujo de la opción 🟡 del semáforo — la auxiliar revisa el reporte
 *   del cliente y deja una recomendación de texto libre.
 * ¿Impacto? Nunca pide diagnóstico ni medicamento (RN-182) — solo un campo de texto.
 */

import { useEffect, useMemo, useState } from 'react';
import { Stethoscope, PawPrint } from 'lucide-react';
import * as reportsApi from '@/api/symptom-reports';
import type { PendingSymptomReport } from '@/types/symptom-reports';
import { SPECIES_LABELS } from '@/types/pricing';

const speciesLabel = (s: string): string =>
  (SPECIES_LABELS as Record<string, string>)[s] ?? s;
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { usePagination } from '@/hooks/usePagination';
import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/InputField';
import { FilterBar } from '@/components/ui/FilterBar';
import { rowNumber } from '@/utils/tablePaging';
import { useToast } from '@/hooks/useToast';

export function StaffSymptomsPage() {
  const { showToast } = useToast();
  const [reports, setReports] = useState<PendingSymptomReport[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const loadReports = () => {
    reportsApi
      .listPendingReports()
      .then(setReports)
      .catch((err) => showToast(err instanceof Error ? err.message : 'No se pudieron cargar los reportes.', 'error'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [search, setSearch] = useState('');
  const hasActiveFilters = search.trim() !== '';
  const filteredReports = useMemo(() => {
    if (!search.trim()) return reports;
    const q = search.trim().toLowerCase();
    return reports.filter(
      (r) => `${r.client.firstName} ${r.client.lastName} ${r.pet.name}`.toLowerCase().includes(q),
    );
  }, [reports, search]);

  const { pageItems, page, setPage, pageSize, setPageSize, pageCount, total } = usePagination(filteredReports, 8);

  const handleReview = async (id: string) => {
    const recommendation = (drafts[id] ?? '').trim();
    if (!recommendation) {
      showToast('Escribe una recomendación antes de enviar.', 'error');
      return;
    }
    setSubmittingId(id);
    try {
      await reportsApi.reviewReport(id, recommendation);
      showToast('Recomendación enviada al cliente.', 'success');
      loadReports();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo enviar la recomendación.', 'error');
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Reportes de síntomas"
        description="Reportes leves que dejaron los clientes (🟡). Revisa y responde con una recomendación."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Pendientes por revisar"
          value={total}
          icon={<Stethoscope className="h-4 w-4" />}
          accent={total > 0 ? 'warning' : 'success'}
        />
        <StatCard
          label="Con más de 3 días"
          value={reports.filter((r) => r.daysWithSymptom > 3).length}
          accent="danger"
        />
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full" lines={2} />
      ) : reports.length === 0 ? (
        <EmptyState icon={<Stethoscope className="h-6 w-6" />} title="No hay reportes pendientes" description="Cuando un cliente reporte un síntoma leve, aparecerá aquí." />
      ) : (
        <>
          <FilterBar onClear={() => setSearch('')} hasActiveFilters={hasActiveFilters}>
            <div className="w-64">
              <InputField id="symptom-search" label="Buscar por cliente o mascota" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ej: Max" />
            </div>
          </FilterBar>

          {total === 0 && <EmptyState icon={<Stethoscope className="h-6 w-6" />} title="Sin resultados con estos filtros" />}

          {total > 0 && (
          <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {pageItems.map((r, i) => (
              <Card key={r.id} padded={false}>
                <div className="p-4">
                  <p className="flex items-center gap-1.5 font-medium text-text">
                    <PawPrint className="h-4 w-4 text-[color:var(--color-primary)]" aria-hidden="true" />
                    <span className="text-text-muted">#{rowNumber(page, pageSize, i)}</span>
                    {r.pet.name}
                    <span className="text-xs font-normal text-text-muted">
                      ({speciesLabel(r.pet.species)}) · {r.client.firstName} {r.client.lastName}
                      {r.client.phone ? ` · ${r.client.phone}` : ''}
                    </span>
                  </p>
                  <p className="mt-2 text-sm text-text">
                    <strong>Síntoma:</strong> {r.symptom}{' '}
                    <span className="text-text-muted">(hace {r.daysWithSymptom} día(s))</span>
                  </p>
                  {r.notes && <p className="mt-1 text-sm text-text-muted">Notas: {r.notes}</p>}

                  <div className="mt-3 flex items-end gap-2">
                    <div className="flex-1">
                      <InputField
                        id={`recommendation-${r.id}`}
                        name={`recommendation-${r.id}`}
                        label="Recomendación"
                        value={drafts[r.id] ?? ''}
                        onChange={(e) => setDrafts((prev) => ({ ...prev, [r.id]: e.target.value }))}
                        placeholder="Ej: Tráela mañana para revisarla en persona."
                        maxLength={1000}
                      />
                    </div>
                    <Button isLoading={submittingId === r.id} onClick={() => handleReview(r.id)}>
                      Enviar
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </ul>
          )}
          {total > 0 && (
          <Pagination
            page={page}
            pageCount={pageCount}
            total={total}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            itemNoun="reportes"
          />
          )}
        </>
      )}
    </div>
  );
}
