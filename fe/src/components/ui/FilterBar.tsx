/**
 * Archivo: components/ui/FilterBar.tsx
 * Descripción: Barra de filtros avanzados, compartida por toda tabla de la app.
 * ¿Para qué? Antes cada pantalla resolvía sus filtros (cuando los tenía) con markup propio.
 *   Este envoltorio solo da estructura y el botón "Limpiar filtros" — cada página sigue
 *   siendo dueña de su propio estado y de disparar la búsqueda/filtrado (en servidor o en
 *   memoria, según el módulo).
 */

import type { ReactNode } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';

interface FilterBarProps {
  children: ReactNode;
  onClear?: () => void;
  hasActiveFilters?: boolean;
}

export function FilterBar({ children, onClear, hasActiveFilters = false }: FilterBarProps) {
  return (
    <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-3">
      <span className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
        <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
        Filtros
      </span>
      <div className="flex flex-1 flex-wrap items-end gap-3">{children}</div>
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          disabled={!hasActiveFilters}
          className="focus-ring mb-0.5 inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-text-muted hover:bg-surface-2 hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
