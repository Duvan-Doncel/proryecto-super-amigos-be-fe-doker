/**
 * Archivo: context/auth-modal-context.ts
 * Descripción: Objeto de contexto para el pop-up de autenticación.
 * ¿Para qué? Separar la creación del contexto del componente Provider — así el archivo
 *   .tsx del Provider solo exporta componentes (requisito de react-refresh), igual que
 *   el patrón usado en auth-context.ts.
 */

import { createContext } from 'react';

// ¿Qué? Qué formulario muestra el pop-up: iniciar sesión, registro, o ninguno (cerrado).
export type AuthModalMode = 'login' | 'register';

export interface AuthModalContextValue {
  // ¿Qué? Modo abierto actualmente, o null si el pop-up está cerrado.
  mode: AuthModalMode | null;
  // ¿Qué? Abre el pop-up en el formulario indicado.
  open: (mode: AuthModalMode) => void;
  // ¿Qué? Cierra el pop-up.
  close: () => void;
}

export const AuthModalContext = createContext<AuthModalContextValue | undefined>(undefined);
