/**
 * Archivo: components/ui/PageHeader.tsx
 * Descripción: Cabecera de página reutilizable — título, propósito y acciones.
 * ¿Para qué? Reemplaza el patrón repetido en ~12 páginas de staff: `<Link>← Volver</Link>`
 *   + `<h1 class="font-display ...">`. Cada pantalla declara aquí SU propósito (el subtítulo),
 *   de modo que ningún módulo quede sin explicar para qué sirve.
 * ¿Impacto? Da consistencia de jerarquía y espaciado a todas las cabeceras.
 */

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  title: ReactNode;
  // ¿Qué? Frase corta que explica para qué sirve esta pantalla.
  description?: ReactNode;
  // ¿Qué? Botones / controles alineados a la derecha del título.
  actions?: ReactNode;
  // ¿Qué? Enlace "volver". Omitir cuando la navegación vive en un sidebar.
  backTo?: string;
  backLabel?: string;
}

export function PageHeader({ title, description, actions, backTo, backLabel = 'Volver' }: PageHeaderProps) {
  return (
    <div className="mb-6">
      {backTo && (
        <Link
          to={backTo}
          className="focus-ring mb-3 inline-flex items-center gap-1.5 rounded text-sm text-text-muted hover:text-text"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {backLabel}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-text">{title}</h1>
          {description && <p className="mt-1 max-w-2xl text-sm text-text-muted">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
