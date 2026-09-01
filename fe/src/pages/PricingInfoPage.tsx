/**
 * Archivo: pages/PricingInfoPage.tsx
 * Descripción: Página pública "Cómo calculamos el precio" del grooming (RF-014).
 * ¿Para qué? Transparencia: el cliente ve el precio base de cada servicio y todos los
 *   recargos (tamaño, pelo, condiciones de piel) antes de agendar. Nada oculto.
 * ¿Impacto? No requiere iniciar sesión — se llega desde el estimador y desde el landing.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as pricingApi from '@/api/pricing';
import type { PublicPricing, SizeTier } from '@/types/pricing';
import { SIZE_LABELS, COAT_LABELS, SPECIES_LABELS, formatCOP } from '@/types/pricing';
import type { PetSpecies } from '@/types/pets';
import { Alert } from '@/components/ui/Alert';

function signed(amount: number): string {
  return amount === 0 ? 'incluido' : `+ ${formatCOP(amount)}`;
}

function SizeTierTable({ title, tiers }: { title: string; tiers: SizeTier[] }) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{title}</p>
      <table className="w-full text-sm">
        <tbody>
          {tiers.map((t, i) => {
            const prev = i > 0 ? tiers[i - 1].maxWeight : null;
            const range =
              t.maxWeight == null
                ? `más de ${prev} kg`
                : prev == null
                  ? `hasta ${t.maxWeight} kg`
                  : `${prev} – ${t.maxWeight} kg`;
            return (
              <tr key={t.size} className="border-t border-gray-200 dark:border-slate-700">
                <td className="py-1.5">{SIZE_LABELS[t.size]}</td>
                <td className="py-1.5 text-right text-gray-600 dark:text-slate-400">{range}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function PricingInfoPage() {
  const [data, setData] = useState<PublicPricing | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    pricingApi
      .getPublicPricing()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar el tarifario.'));
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link to="/" className="text-sm text-gray-500 dark:text-slate-400 hover:underline">
        ← Volver
      </Link>

      <h1 className="text-2xl font-comic tracking-wide text-gray-900 dark:text-slate-100 mt-4 mb-2">
        ✂️ Cómo calculamos el precio
      </h1>
      <p className="text-sm text-gray-600 dark:text-slate-400 mb-8">
        El precio de un servicio de grooming parte de un <strong>precio base</strong> y se le suman
        recargos según tu mascota: su tamaño, el largo de su pelo y algunas condiciones de piel.
      </p>

      {error && <Alert type="error" message={error} />}

      {data && (
        <div className="space-y-10">
          {/* ─── Servicios y su precio base ─── */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-3">
              Servicios
            </h2>
            <ul className="space-y-2">
              {data.services.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-slate-700 px-4 py-3 text-sm"
                >
                  <span className="font-medium text-gray-900 dark:text-slate-100">{s.name}</span>
                  <span className="tabular-nums">desde {formatCOP(s.basePrice)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">
              El precio base corresponde a una mascota pequeña, de pelo corto y sin condiciones de piel.
            </p>
          </section>

          {/* ─── Recargo por tamaño (tramos propios por especie) ─── */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-3">
              Según el tamaño
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {(['canina', 'felina'] as PetSpecies[]).map((species) => (
                <SizeTierTable
                  key={species}
                  title={SPECIES_LABELS[species]}
                  tiers={data.sizeTiers.filter((t) => t.species === species)}
                />
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">
              El recargo exacto por tramo depende de cada servicio — lo ves en el estimador al
              agendar.
            </p>
          </section>

          {/* ─── Recargo por pelo ─── */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-3">
              Según el tipo de pelo
            </h2>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              El <strong>pelo largo</strong> ({COAT_LABELS.largo.toLowerCase()}) necesita más tiempo
              de desenredado y secado, así que suele tener un recargo. El{' '}
              {COAT_LABELS.corto.toLowerCase()} va incluido en el precio base.
            </p>
          </section>

          {/* ─── Recargo por condición de piel ─── */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-3">
              Según condiciones de piel
            </h2>
            <ul className="space-y-2">
              {data.skinSurcharges.map((r) => (
                <li
                  key={r.type}
                  className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-slate-700 px-4 py-3 text-sm"
                >
                  <span>{r.label}</span>
                  <span className="tabular-nums text-amber-700 dark:text-amber-500">
                    {signed(r.amount)}
                  </span>
                </li>
              ))}
            </ul>

            {data.blockingConditions.length > 0 && (
              <div className="mt-4 rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 p-4 text-sm">
                <p className="font-medium text-red-800 dark:text-red-300">
                  Estas situaciones necesitan revisión antes de un baño
                </p>
                <p className="mt-1 text-red-700 dark:text-red-400">
                  {data.blockingConditions.join(', ')}. En estos casos no se puede agendar grooming
                  directamente: primero el personal revisa a la mascota a través de un{' '}
                  <Link to="/app/sintoma" className="underline">
                    reporte de síntoma
                  </Link>
                  . Super Amigos no cuenta con veterinario en planta.
                </p>
              </div>
            )}
          </section>

          {/* ─── Recargo por comportamiento ─── */}
          {data.behaviorSurcharges.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-3">
                Según el comportamiento
              </h2>
              <p className="text-sm text-gray-600 dark:text-slate-400 mb-3">
                Una mascota nerviosa o difícil de manejar lleva más tiempo y a veces dos personas.
              </p>
              <ul className="space-y-2">
                {data.behaviorSurcharges.map((r) => (
                  <li
                    key={r.behavior}
                    className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-slate-700 px-4 py-3 text-sm"
                  >
                    <span>{r.label}</span>
                    <span className="tabular-nums text-amber-700 dark:text-amber-500">
                      {signed(r.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
