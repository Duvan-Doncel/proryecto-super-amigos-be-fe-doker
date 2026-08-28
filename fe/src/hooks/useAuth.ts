/**
 * Archivo: hooks/useAuth.ts
 * Descripción: Hook personalizado para acceder al contexto de autenticación.
 * ¿Para qué? Abstraer el acceso a AuthContext y proporcionar un error claro
 *   si el hook se usa fuera del AuthProvider.
 */

import { useContext } from 'react';
import { AuthContext } from '@/context/auth-context';
import type { AuthContextValue } from '@/context/auth-context';

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un <AuthProvider>');
  }

  return context;
}
