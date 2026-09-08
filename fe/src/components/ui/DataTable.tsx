/**
 * Archivo: components/ui/DataTable.tsx
 * Descripción: Envoltorio de tabla consistente para las pantallas de gestión.
 * ¿Para qué? Da a todas las tablas el mismo cascarón: scroll horizontal en móvil,
 *   header con estilo uniforme, filas con hover y densidad pareja, y ranuras para
 *   estado de carga / vacío. No es una abstracción pesada: se sigue escribiendo el
 *   <thead>/<tbody> a mano, solo se comparten los estilos.
 * ¿Impacto? El cuerpo de la tabla SIEMPRE hace scroll dentro de su contenedor —
 *   la página nunca se desborda en horizontal.
 */

import type { ReactNode } from 'react';
import { Skeleton } from './Skeleton';
import { EmptyState } from './EmptyState';

interface DataTableProps {
  // ¿Qué? <th> de la cabecera.
  head: ReactNode;
  // ¿Qué? <tr> del cuerpo. Se ignora si isLoading o isEmpty.
  children: ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: ReactNode;
  emptyAction?: ReactNode;
  // ¿Qué? Nº de columnas — para el ancho del estado de carga.
  columns?: number;
}

export function DataTable({
  head,
  children,
  isLoading = false,
  isEmpty = false,
  emptyTitle = 'Sin registros',
  emptyDescription,
  emptyAction,
}: DataTableProps) {
  if (isLoading) {
    return (
      <div className="card p-4">
        <Skeleton className="h-9 w-full" />
        <div className="mt-3">
          <Skeleton className="h-12 w-full" lines={5} />
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
    );
  }

  return (
    <div className="card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-surface-2 text-left">
            <tr className="[&>th]:whitespace-nowrap [&>th]:px-4 [&>th]:py-3 [&>th]:font-semibold [&>th]:text-text-muted">
              {head}
            </tr>
          </thead>
          <tbody className="divide-y divide-border [&>tr]:transition-colors hover:[&>tr]:bg-surface-2/60 [&>tr>td]:px-4 [&>tr>td]:py-3 [&>tr>td]:align-middle [&>tr>td]:text-text">
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
}
