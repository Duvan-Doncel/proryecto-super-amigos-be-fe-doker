/**
 * Archivo: context/AuthModalProvider.tsx
 * Descripción: Provider del pop-up de autenticación — guarda si está abierto y en qué modo,
 *   y renderiza el <AuthModal /> una sola vez para toda la app.
 * ¿Para qué? Que cualquier componente (navbar, landing) abra el mismo pop-up con un hook,
 *   sin prop drilling.
 * ¿Impacto? Debe montarse DENTRO del Router (el modal usa useNavigate) y del AuthProvider
 *   (los formularios usan useAuth).
 */

import { useCallback, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthModalContext } from './auth-modal-context';
import type { AuthModalMode } from './auth-modal-context';
import { AuthModal } from '@/components/auth/AuthModal';

interface AuthModalProviderProps {
  children: ReactNode;
}

export function AuthModalProvider({ children }: AuthModalProviderProps) {
  const [mode, setMode] = useState<AuthModalMode | null>(null);
  const location = useLocation();

  const open = useCallback((next: AuthModalMode) => setMode(next), []);
  const close = useCallback(() => setMode(null), []);

  // ¿Qué? Cierra el pop-up cuando cambia la ruta (por ejemplo, al abrir un documento
  //   legal o con el botón "atrás" del navegador). Comparar la ruta actual con la del
  //   render anterior y ajustar el estado durante el render es el patrón recomendado
  //   por React para esto (no requiere useEffect).
  const [prevPath, setPrevPath] = useState(location.pathname);
  if (location.pathname !== prevPath) {
    setPrevPath(location.pathname);
    setMode(null);
  }

  return (
    <AuthModalContext.Provider value={{ mode, open, close }}>
      {children}
      <AuthModal />
    </AuthModalContext.Provider>
  );
}
