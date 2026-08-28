/**
 * Archivo: components/ui/ProtectedRoute.tsx
 * Descripción: Componente que protege rutas que requieren autenticación y, opcionalmente,
 *   un rol específico (client o staff).
 * ¿Para qué? Redirigir al login si no hay sesión, o a una ruta segura si el rol no coincide
 *   (ej: un cliente no debe poder abrir el panel de staff escribiendo la URL directamente).
 * ¿Impacto? Sin este componente cualquier usuario podría navegar a rutas privadas
 *   directamente desde la URL del navegador.
 */

import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types/auth';

interface ProtectedRouteProps {
  children: ReactNode;
  // ¿Qué? Si se indica, solo ese rol puede ver la ruta — los demás son redirigidos.
  role?: UserRole;
}

export function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <p className="text-gray-500 dark:text-slate-400 text-sm">Cargando...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // ¿Qué? Si la ruta exige un rol y el usuario tiene otro, lo mandamos a su propia zona.
  if (role && user?.role !== role) {
    return <Navigate to={user?.role === 'staff' ? '/staff' : '/app'} replace />;
  }

  return <>{children}</>;
}
