/**
 * Archivo: hooks/useToast.ts
 * Descripción: Hook para lanzar notificaciones (toasts) desde cualquier componente.
 * ¿Para qué? Abstraer el acceso a ToastContext y fallar claro si se usa fuera del Provider.
 */

import { useContext } from 'react';
import { ToastContext, type ToastContextValue } from '@/context/toast-context';

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);

  if (context === undefined) {
    throw new Error('useToast debe usarse dentro de un <ToastProvider>');
  }

  return context;
}
