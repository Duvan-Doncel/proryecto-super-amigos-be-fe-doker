/**
 * Archivo: hooks/useTheme.ts
 * Descripción: Hook para acceder al contexto de tema (claro / oscuro / sistema).
 * ¿Para qué? Abstraer el acceso a ThemeContext y fallar con un error claro si se usa
 *   fuera del <ThemeProvider>.
 * ¿Impacto? Reemplaza la versión anterior, que tenía estado local por consumidor y no
 *   se sincronizaba entre componentes.
 */

import { useContext } from 'react';
import { ThemeContext, type ThemeContextValue } from '@/context/theme-context';

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme debe usarse dentro de un <ThemeProvider>');
  }

  return context;
}
