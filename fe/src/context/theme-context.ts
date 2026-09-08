/**
 * Archivo: context/theme-context.ts
 * Descripción: Definición del contexto de tema, separada del Provider.
 * ¿Para qué? ESLint (react-refresh/only-export-components) exige que un .tsx solo
 *   exporte componentes — el objeto Context y sus tipos viven aquí.
 * ¿Impacto? Un único origen de verdad del tema para toda la app (antes cada consumidor
 *   del hook tenía su propio useState y no se sincronizaban entre sí).
 */

import { createContext } from 'react';

// ¿Qué? Elección del usuario. 'system' sigue la preferencia del sistema operativo en vivo.
export type ThemePreference = 'light' | 'dark' | 'system';

// ¿Qué? Tema efectivamente aplicado (nunca 'system' — ya está resuelto).
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeContextValue {
  // Elección persistida del usuario.
  preference: ThemePreference;
  // Tema aplicado al DOM ahora mismo.
  resolvedTheme: ResolvedTheme;
  // Cambia la elección y la persiste.
  setPreference: (preference: ThemePreference) => void;
  // Atajo: alterna entre claro y oscuro tomando como base el tema resuelto actual.
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const THEME_STORAGE_KEY = 'theme';
