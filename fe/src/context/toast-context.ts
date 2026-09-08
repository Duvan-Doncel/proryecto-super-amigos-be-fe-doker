/**
 * Archivo: context/toast-context.ts
 * Descripción: Definición del contexto de notificaciones (toasts), separada del Provider.
 * ¿Para qué? Regla de ESLint react-refresh/only-export-components — el .tsx solo exporta
 *   componentes; el Context y los tipos viven aquí.
 */

import { createContext } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

export interface ToastContextValue {
  // ¿Qué? Muestra una notificación efímera. Devuelve el id por si hay que cerrarla antes.
  showToast: (message: string, type?: ToastType) => string;
  dismissToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);
