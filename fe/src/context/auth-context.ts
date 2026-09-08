/**
 * Archivo: context/auth-context.ts
 * Descripción: Definición del contexto de autenticación, separada del Provider.
 * ¿Para qué? ESLint (react-refresh/only-export-components) exige que un archivo
 *   .tsx solo exporte componentes — el objeto Context vive aquí para que
 *   AuthContext.tsx pueda exportar únicamente el componente AuthProvider.
 */

import { createContext } from 'react';
import type { User, LoginRequest, RegisterRequest } from '@/types/auth';

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<User>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  // ¿Qué? Vuelve a pedir el perfil al backend y lo refresca en el contexto.
  //   Se usa tras editar el perfil para que Navbar, saludos, etc. muestren el dato nuevo.
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
