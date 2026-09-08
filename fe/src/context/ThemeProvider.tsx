/**
 * Archivo: context/ThemeProvider.tsx
 * Descripción: Provider global del tema claro/oscuro/sistema.
 * ¿Para qué? Una sola fuente de verdad del tema, aplicar la clase `.dark` en <html> y
 *   persistir la elección del usuario en localStorage.
 * ¿Impacto? El guard inline de index.html ya fijó la clase correcta antes del paint; este
 *   provider toma el control y reacciona a cambios (toggle, o el sistema si es 'system').
 *
 * ¿Por qué esta forma? `resolvedTheme` se DERIVA en render de `preference` + `systemDark`
 *   (no se guarda en estado aparte), y el efecto solo toca el DOM. `systemDark` únicamente
 *   cambia desde el callback de `matchMedia` — una suscripción a un sistema externo.
 */

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ThemeContext,
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type ThemePreference,
} from './theme-context';

function readStoredPreference(): ThemePreference {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
  } catch {
    /* localStorage no disponible (modo privado, etc.) */
  }
  return 'system';
}

const systemMediaQuery = () => window.matchMedia('(prefers-color-scheme: dark)');

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readStoredPreference);
  const [systemDark, setSystemDark] = useState<boolean>(() => systemMediaQuery().matches);

  const resolvedTheme: ResolvedTheme =
    preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;

  // ¿Qué? Efecto puro de sincronización con un sistema externo (el DOM). Sin setState.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
  }, [resolvedTheme]);

  // ¿Qué? Suscripción a la preferencia del SO — setState solo desde el callback.
  useEffect(() => {
    const mq = systemMediaQuery();
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* si no se puede persistir, al menos aplica en esta sesión */
    }
    setPreferenceState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setPreference(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setPreference]);

  const value = useMemo(
    () => ({ preference, resolvedTheme, setPreference, toggleTheme }),
    [preference, resolvedTheme, setPreference, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
