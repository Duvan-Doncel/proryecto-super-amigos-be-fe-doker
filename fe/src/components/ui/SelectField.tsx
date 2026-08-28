/**
 * Archivo: components/ui/SelectField.tsx
 * Descripción: Campo de formulario tipo <select> accesible con label y mensaje de error.
 * ¿Para qué? Es el equivalente de InputField para selectores (mascota, servicio, etc.),
 *   usado en los formularios del semáforo (RF-009, RF-010).
 */

import type { SelectHTMLAttributes, ReactNode } from 'react';

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  id: string;
  error?: string;
  children: ReactNode;
}

export function SelectField({ label, id, error, className = '', children, ...props }: SelectFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-gray-700 dark:text-slate-300">
        {label}
      </label>

      <select
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className={[
          'w-full px-3 py-2 text-sm rounded-lg',
          'bg-white dark:bg-slate-800',
          'text-gray-900 dark:text-slate-100',
          'transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-0',
          error
            ? 'border border-red-500 dark:border-red-400'
            : 'border border-gray-300 dark:border-slate-600',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {children}
      </select>

      {error && (
        <p id={errorId} role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
