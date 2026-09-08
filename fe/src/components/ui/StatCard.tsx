/**
 * Archivo: components/ui/StatCard.tsx
 * Descripción: Tarjeta de métrica (KPI) — etiqueta, valor grande, pista y delta opcional.
 * ¿Para qué? Unifica el `StatTile` que vivía dentro de StaffHomePage y lo hace reutilizable
 *   en el dashboard Y en la tira de resumen de cada módulo de staff.
 * ¿Impacto? RNF de accesibilidad: el color de acento nunca es la única señal — siempre hay
 *   etiqueta y valor en texto.
 */

import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

type Accent = 'brand' | 'accent' | 'success' | 'warning' | 'danger' | 'neutral';

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  accent?: Accent;
  // ¿Qué? Variación respecto a un período anterior, en puntos porcentuales o absolutos.
  //   Positivo = verde ↑, negativo = rojo ↓. Se omite si no hay comparativo.
  delta?: number;
  deltaSuffix?: string;
}

const ACCENT_BAR: Record<Accent, string> = {
  brand: 'bg-[color:var(--color-primary)]',
  accent: 'bg-[color:var(--color-accent)]',
  success: 'bg-[color:var(--color-success)]',
  warning: 'bg-[color:var(--color-warning)]',
  danger: 'bg-[color:var(--color-danger)]',
  neutral: 'bg-border',
};

export function StatCard({
  label,
  value,
  hint,
  icon,
  accent = 'brand',
  delta,
  deltaSuffix = '%',
}: StatCardProps) {
  const showDelta = typeof delta === 'number' && Number.isFinite(delta);

  return (
    <div className="card relative overflow-hidden p-5">
      <span className={`absolute inset-x-0 top-0 h-1 ${ACCENT_BAR[accent]}`} aria-hidden="true" />
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-text-muted">{label}</p>
        {icon && <span className="text-text-muted">{icon}</span>}
      </div>
      <p className="mt-1 font-display text-3xl font-extrabold text-text">{value}</p>
      <div className="mt-1 flex items-center gap-2">
        {showDelta && (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
              delta >= 0
                ? 'text-[color:var(--color-success)]'
                : 'text-[color:var(--color-danger)]'
            }`}
          >
            {delta >= 0 ? (
              <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {delta >= 0 ? '+' : ''}
            {delta}
            {deltaSuffix}
          </span>
        )}
        {hint && <p className="text-xs text-text-muted">{hint}</p>}
      </div>
    </div>
  );
}
