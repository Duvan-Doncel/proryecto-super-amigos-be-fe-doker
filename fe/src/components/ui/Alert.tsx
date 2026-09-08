/**
 * Archivo: components/ui/Alert.tsx
 * Descripción: Componente de alerta para feedback visual de éxito o error.
 * ¿Para qué? Mostrar mensajes de resultado de operaciones (login fallido, registro
 *   exitoso, contraseña cambiada, etc.) de forma accesible y consistente.
 * ¿Impacto? Sin role="alert" los lectores de pantalla no anuncian el mensaje
 *   automáticamente cuando aparece.
 */

import type { ReactNode } from 'react';

interface AlertProps {
  // ¿Qué? Tipo de alerta — determina el color y el icono.
  type: 'error' | 'success' | 'info';
  // ¿Qué? El mensaje a mostrar al usuario — texto simple o JSX (ej: con partes en negrita).
  message: ReactNode;
}

// ¿Qué? Mapa de clases Tailwind por tipo de alerta, sobre tokens de estado.
const TYPE_CLASSES: Record<AlertProps['type'], string> = {
  error:
    'bg-[color:var(--color-danger-soft)] border border-[color:var(--color-danger)]/30 ' +
    'text-[color:var(--color-danger)]',
  success:
    'bg-[color:var(--color-success-soft)] border border-[color:var(--color-success)]/30 ' +
    'text-[color:var(--color-success)]',
  info:
    'bg-[color:var(--color-info-soft)] border border-[color:var(--color-info)]/30 ' +
    'text-[color:var(--color-info)]',
};

export function Alert({ type, message }: AlertProps) {
  return (
    // ¿Qué? role="alert" hace que el lector de pantalla anuncie el mensaje al aparecer.
    <div role="alert" className={`rounded-lg px-4 py-3 text-sm ${TYPE_CLASSES[type]}`}>
      {message}
    </div>
  );
}
