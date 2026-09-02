/**
 * Archivo: hooks/useAuthModal.ts
 * Descripción: Hook para abrir y cerrar el pop-up de inicio de sesión / registro.
 * ¿Para qué? Que la navbar, el landing y cualquier otro componente puedan abrir el
 *   mismo pop-up sin pasar props ni duplicar estado.
 */

import { useContext } from 'react';
import { AuthModalContext } from '@/context/auth-modal-context';
import type { AuthModalContextValue } from '@/context/auth-modal-context';

export function useAuthModal(): AuthModalContextValue {
  const context = useContext(AuthModalContext);

  if (context === undefined) {
    throw new Error('useAuthModal debe usarse dentro de un <AuthModalProvider>');
  }

  return context;
}
