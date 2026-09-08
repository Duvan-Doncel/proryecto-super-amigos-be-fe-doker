/**
 * Archivo: components/ui/Pagination.tsx
 * Descripción: Control de paginación reutilizable — el MISMO en toda la app.
 * ¿Para qué? El brief pide paginación consistente en todas las tablas y listados
 *   (clientes, mascotas, citas, servicios, historial, productos…). Este componente es
 *   presentacional: recibe la página actual, el total y los callbacks; da igual si la
 *   paginación se resuelve en el cliente (hook usePagination) o en el servidor (meta).
 * ¿Impacto? Incluye: página actual, total de páginas, anterior/siguiente, números de
 *   página con elipsis, y selector de "registros por página". Accesible: `nav[aria-label]`,
 *   `aria-current="page"` en la página activa.
 */

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  pageCount: number;
  // ¿Qué? Total de registros (para el resumen "1–10 de 42").
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  // ¿Qué? Palabra para el resumen: "productos", "citas", "clientes"…
  itemNoun?: string;
}

// ¿Qué? Genera la secuencia de páginas a mostrar, con elipsis: 1 … 4 5 [6] 7 8 … 20.
function pageWindow(current: number, count: number): (number | 'gap')[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const pages: (number | 'gap')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(count - 1, current + 1);
  if (start > 2) pages.push('gap');
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < count - 1) pages.push('gap');
  pages.push(count);
  return pages;
}

export function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
  itemNoun = 'registros',
}: PaginationProps) {
  if (total === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const canPrev = page > 1;
  const canNext = page < pageCount;

  const numberBtn =
    'focus-ring min-w-9 rounded-lg border border-border px-2.5 py-1.5 text-sm font-medium ' +
    'text-text hover:bg-surface-2 disabled:opacity-40 disabled:pointer-events-none';

  return (
    <nav
      aria-label="Paginación"
      className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-xs text-text-muted">
        {from}–{to} de {total} {itemNoun}
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          className={numberBtn}
          onClick={() => onPageChange(page - 1)}
          disabled={!canPrev}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>

        {pageWindow(page, pageCount).map((p, i) =>
          p === 'gap' ? (
            <span key={`gap-${i}`} className="px-1.5 text-text-muted" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={
                p === page
                  ? 'focus-ring min-w-9 rounded-lg border border-[color:var(--color-primary)] bg-[color:var(--color-primary)] px-2.5 py-1.5 text-sm font-semibold text-white'
                  : numberBtn
              }
              aria-current={p === page ? 'page' : undefined}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          ),
        )}

        <button
          type="button"
          className={numberBtn}
          onClick={() => onPageChange(page + 1)}
          disabled={!canNext}
          aria-label="Página siguiente"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {onPageSizeChange && (
        <label className="flex items-center gap-2 text-xs text-text-muted">
          Por página
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="focus-ring rounded-lg border border-border bg-surface px-2 py-1 text-sm text-text"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>
      )}
    </nav>
  );
}
