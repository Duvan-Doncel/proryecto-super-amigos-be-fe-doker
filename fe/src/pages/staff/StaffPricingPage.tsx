/**
 * Archivo: pages/staff/StaffPricingPage.tsx
 * Descripción: Configuración del tarifario del grooming (RF-014, solo staff/admin).
 * ¿Para qué? Ajustar sin tocar código: tramos de peso por especie, recargos por condición
 *   de piel y por comportamiento, y los recargos por tamaño/pelo de cada servicio (perro y gato).
 * ¿Impacto? Estos valores alimentan directamente el estimador y el agendamiento (RF-009).
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as pricingApi from '@/api/pricing';
import type { BehaviorRule, PricingConfig, SizeTier, SkinRule } from '@/types/pricing';
import { SIZE_LABELS, COAT_LABELS, SPECIES_LABELS, formatCOP } from '@/types/pricing';
import type { CoatType, PetSpecies, PetSize } from '@/types/pets';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

const SIZE_ORDER: PetSize[] = ['pequeno', 'mediano', 'grande', 'gigante'];
const COAT_ORDER: CoatType[] = ['corto', 'largo'];
const SPECIES_ORDER: PetSpecies[] = ['canina', 'felina'];

function numInput(value: number | null, onChange: (v: number | null) => void, nullable = false) {
  return (
    <input
      type="number"
      min={0}
      step="500"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value === '' ? (nullable ? null : 0) : Number(e.target.value))}
      className="w-28 px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500 tabular-nums"
    />
  );
}

export function StaffPricingPage() {
  const [config, setConfig] = useState<PricingConfig | null>(null);
  const [tiers, setTiers] = useState<SizeTier[]>([]);
  const [skinRules, setSkinRules] = useState<SkinRule[]>([]);
  const [behaviorRules, setBehaviorRules] = useState<BehaviorRule[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = (c: PricingConfig) => {
    setConfig(c);
    setTiers(c.sizeTiers);
    setSkinRules(c.skinRules);
    setBehaviorRules(c.behaviorRules);
  };

  useEffect(() => {
    pricingApi
      .getPricingConfig()
      .then(load)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar el tarifario.'));
  }, []);

  const wrap = async (key: string, fn: () => Promise<PricingConfig>) => {
    setBusy(key);
    setError(null);
    setSaved(null);
    try {
      load(await fn());
      setSaved('Cambios guardados.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.');
    } finally {
      setBusy(null);
    }
  };

  if (!config) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link to="/staff" className="text-sm text-gray-500 dark:text-slate-400 hover:underline">← Volver</Link>
        {error ? <Alert type="error" message={error} /> : <p className="mt-6 text-sm text-gray-500">Cargando…</p>}
      </div>
    );
  }

  const setTier = (species: PetSpecies, size: PetSize, maxWeight: number | null) =>
    setTiers((prev) =>
      prev.map((t) => (t.species === species && t.size === size ? { ...t, maxWeight } : t)),
    );

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link to="/staff" className="text-sm text-gray-500 dark:text-slate-400 hover:underline">← Volver</Link>
      <h1 className="text-2xl font-comic tracking-wide text-gray-900 dark:text-slate-100 mt-4 mb-6">
        💲 Tarifario de grooming
      </h1>

      {error && <div className="mb-4"><Alert type="error" message={error} /></div>}
      {saved && <div className="mb-4"><Alert type="success" message={saved} /></div>}

      {/* ─── Tramos de tamaño (por especie) ─── */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-1">Tramos de tamaño</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-3">
          Peso máximo (kg) de cada tramo, separado por especie. El tramo “Gigante” no tiene tope.
        </p>
        <div className="grid gap-5 sm:grid-cols-2">
          {SPECIES_ORDER.map((species) => (
            <div key={species}>
              <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                {SPECIES_LABELS[species]}
              </p>
              <div className="space-y-2">
                {SIZE_ORDER.map((size) => {
                  const t = tiers.find((x) => x.species === species && x.size === size);
                  if (!t) return null;
                  return (
                    <div key={size} className="flex items-center gap-3 text-sm">
                      <span className="w-20 text-gray-700 dark:text-slate-300">{SIZE_LABELS[size]}</span>
                      {size === 'gigante' ? (
                        <span className="text-gray-400 dark:text-slate-500">sin tope</span>
                      ) : (
                        numInput(t.maxWeight, (v) => setTier(species, size, v), true)
                      )}
                      <span className="text-gray-400 dark:text-slate-500">kg</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <Button isLoading={busy === 'tiers'} onClick={() => wrap('tiers', () => pricingApi.updateSizeTiers(tiers))}>
            Guardar tramos
          </Button>
        </div>
      </section>

      {/* ─── Reglas de condición de piel ─── */}
      <RuleEditor
        title="Condiciones de piel"
        help="Recargo de cada etiqueta. Las marcadas como “bloquea” impiden agendar y derivan al reporte de síntoma."
        rows={skinRules}
        rowKey={(r) => r.type}
        busy={busy === 'skin'}
        onAmount={(key, amount) =>
          setSkinRules((prev) => prev.map((r) => (r.type === key ? { ...r, amount } : r)))
        }
        onBlock={(key, blocksBooking) =>
          setSkinRules((prev) => prev.map((r) => (r.type === key ? { ...r, blocksBooking } : r)))
        }
        onSave={() => wrap('skin', () => pricingApi.updateSkinRules(skinRules))}
      />

      {/* ─── Reglas de comportamiento ─── */}
      <RuleEditor
        title="Comportamiento"
        help="Un animal nervioso lleva más tiempo; uno agresivo debe evaluarse en persona (marcá “bloquea”)."
        rows={behaviorRules}
        rowKey={(r) => r.behavior}
        busy={busy === 'behavior'}
        onAmount={(key, amount) =>
          setBehaviorRules((prev) => prev.map((r) => (r.behavior === key ? { ...r, amount } : r)))
        }
        onBlock={(key, blocksBooking) =>
          setBehaviorRules((prev) => prev.map((r) => (r.behavior === key ? { ...r, blocksBooking } : r)))
        }
        onSave={() => wrap('behavior', () => pricingApi.updateBehaviorRules(behaviorRules))}
      />

      {/* ─── Recargos por servicio (perro y gato) ─── */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-1">
          Recargos por servicio
        </h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-3">
          Cuánto suma cada tamaño y el pelo largo, por servicio y especie. Dejar en 0 = sin recargo.
        </p>
        <div className="space-y-4">
          {config.services.map((s) => (
            <ServiceModifierEditor
              key={s.id}
              service={s}
              busy={busy === `svc-${s.id}`}
              onSave={(sizeMods, coatMods) =>
                wrap(`svc-${s.id}`, () => pricingApi.updateServiceModifiers(s.id, sizeMods, coatMods))
              }
            />
          ))}
        </div>
      </section>
    </div>
  );
}

interface RuleEditorProps<R> {
  title: string;
  help: string;
  rows: R[];
  rowKey: (r: R) => string;
  busy: boolean;
  onAmount: (key: string, amount: number) => void;
  onBlock: (key: string, blocksBooking: boolean) => void;
  onSave: () => void;
}

function RuleEditor<R extends { label: string; amount: number; blocksBooking: boolean }>({
  title,
  help,
  rows,
  rowKey,
  busy,
  onAmount,
  onBlock,
  onSave,
}: RuleEditorProps<R>) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-1">{title}</h2>
      <p className="text-sm text-gray-500 dark:text-slate-400 mb-3">{help}</p>
      <div className="space-y-2">
        {rows.map((r) => {
          const key = rowKey(r);
          return (
            <div key={key} className="flex items-center gap-3 text-sm">
              <span className="flex-1 text-gray-700 dark:text-slate-300">{r.label}</span>
              <input
                type="number"
                min={0}
                step="500"
                value={r.amount}
                onChange={(e) => onAmount(key, Number(e.target.value))}
                className="w-28 px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500 tabular-nums"
              />
              <label className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={r.blocksBooking}
                  onChange={(e) => onBlock(key, e.target.checked)}
                  className="rounded border-gray-300 dark:border-slate-600 text-red-600 focus:ring-red-500"
                />
                bloquea
              </label>
            </div>
          );
        })}
      </div>
      <div className="mt-3">
        <Button isLoading={busy} onClick={onSave}>Guardar {title.toLowerCase()}</Button>
      </div>
    </section>
  );
}

interface EditorProps {
  service: PricingConfig['services'][number];
  busy: boolean;
  onSave: (
    sizeMods: { species: PetSpecies; size: PetSize; amount: number }[],
    coatMods: { species: PetSpecies; coatType: CoatType; amount: number }[],
  ) => void;
}

function ServiceModifierEditor({ service, busy, onSave }: EditorProps) {
  const key = (sp: PetSpecies, x: string) => `${sp}:${x}`;
  const initSize = () =>
    Object.fromEntries(
      SPECIES_ORDER.flatMap((sp) =>
        SIZE_ORDER.map((size) => [
          key(sp, size),
          service.sizeModifiers.find((m) => m.species === sp && m.size === size)?.amount ?? 0,
        ]),
      ),
    ) as Record<string, number>;
  const initCoat = () =>
    Object.fromEntries(
      SPECIES_ORDER.flatMap((sp) =>
        COAT_ORDER.map((coat) => [
          key(sp, coat),
          service.coatModifiers.find((m) => m.species === sp && m.coatType === coat)?.amount ?? 0,
        ]),
      ),
    ) as Record<string, number>;

  const [sizeAmts, setSizeAmts] = useState<Record<string, number>>(initSize);
  const [coatAmts, setCoatAmts] = useState<Record<string, number>>(initCoat);

  const save = () => {
    const sizeMods = SPECIES_ORDER.flatMap((sp) =>
      SIZE_ORDER.filter((size) => sizeAmts[key(sp, size)] > 0).map((size) => ({
        species: sp,
        size,
        amount: sizeAmts[key(sp, size)],
      })),
    );
    const coatMods = SPECIES_ORDER.flatMap((sp) =>
      COAT_ORDER.filter((coat) => coatAmts[key(sp, coat)] > 0).map((coat) => ({
        species: sp,
        coatType: coat,
        amount: coatAmts[key(sp, coat)],
      })),
    );
    onSave(sizeMods, coatMods);
  };

  return (
    <div className="rounded-lg border border-gray-200 dark:border-slate-700 p-4">
      <p className="font-medium text-gray-900 dark:text-slate-100 text-sm">
        {service.name}{' '}
        <span className="text-gray-400 dark:text-slate-500">· base {formatCOP(service.basePrice)}</span>
      </p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {SPECIES_ORDER.map((sp) => (
          <div key={sp}>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-slate-500 mb-2">
              {SPECIES_LABELS[sp]}
            </p>
            <div className="space-y-2 text-sm">
              {SIZE_ORDER.map((size) => (
                <label key={size} className="flex items-center justify-between gap-2">
                  <span className="text-gray-600 dark:text-slate-400">{SIZE_LABELS[size]}</span>
                  <input
                    type="number"
                    min={0}
                    step="500"
                    value={sizeAmts[key(sp, size)]}
                    onChange={(e) => setSizeAmts((p) => ({ ...p, [key(sp, size)]: Number(e.target.value) }))}
                    className="w-24 px-2 py-1 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 tabular-nums"
                  />
                </label>
              ))}
              {COAT_ORDER.map((coat) => (
                <label key={coat} className="flex items-center justify-between gap-2">
                  <span className="text-gray-600 dark:text-slate-400">Pelo {COAT_LABELS[coat].toLowerCase()}</span>
                  <input
                    type="number"
                    min={0}
                    step="500"
                    value={coatAmts[key(sp, coat)]}
                    onChange={(e) => setCoatAmts((p) => ({ ...p, [key(sp, coat)]: Number(e.target.value) }))}
                    className="w-24 px-2 py-1 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 tabular-nums"
                  />
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-end">
        <Button variant="secondary" className="text-xs px-3 py-1.5" isLoading={busy} onClick={save}>
          Guardar
        </Button>
      </div>
    </div>
  );
}
