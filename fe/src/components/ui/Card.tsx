/**
 * Archivo: components/ui/Card.tsx
 * Descripción: Contenedor "tarjeta" estándar del design system.
 * ¿Para qué? Reemplaza el patrón repetido `rounded-xl card bg-white
 *   dark:bg-slate-900 p-5` por una sola pieza tematizada con tokens.
 * ¿Impacto? Cambiar el estilo de tarjeta aquí lo actualiza en toda la app.
 */

import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  // ¿Qué? Padding interno estándar. Poner false cuando el contenido gestiona su propio
  //   padding (p. ej. una tabla a sangre completa).
  padded?: boolean;
  children: ReactNode;
}

export function Card({ padded = true, className = '', children, ...props }: CardProps) {
  return (
    <div className={['card', padded ? 'p-5' : '', className].filter(Boolean).join(' ')} {...props}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  // ¿Qué? Acciones a la derecha del título (botón "Nuevo…", filtro, etc.).
  actions?: ReactNode;
}

export function CardHeader({ title, description, actions }: CardHeaderProps) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="font-display text-lg font-bold text-text">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
