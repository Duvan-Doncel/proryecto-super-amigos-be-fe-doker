/**
 * Archivo: components/ui/EmptyState.tsx
 * Descripción: Estado vacío consistente para listas y tablas sin datos.
 * ¿Para qué? Antes cada página resolvía el "no hay nada" con un `<p>` suelto distinto.
 *   Esto da un mensaje claro + acción sugerida en un formato uniforme.
 */

import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-6 py-10 text-center">
      {icon && <div className="text-text-muted">{icon}</div>}
      <p className="font-display font-bold text-text">{title}</p>
      {description && <p className="max-w-sm text-sm text-text-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
