/**
 * Archivo: components/ui/ThemeToggle.tsx
 * Descripción: Control de tema — claro / oscuro / sistema.
 * ¿Para qué? Permitir al usuario elegir su tema y que "sistema" siga la preferencia del
 *   SO en vivo. La elección se persiste (ver ThemeProvider) y se aplica sin parpadeo.
 * ¿Impacto? Dos presentaciones: `variant="segmented"` (3 botones, para menús/ajustes) y
 *   `variant="icon"` (un solo botón que alterna claro/oscuro, para barras compactas).
 */

import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import type { ThemePreference } from '@/context/theme-context';

const OPTIONS: { value: ThemePreference; label: string; Icon: typeof Sun }[] = [
  { value: 'light', label: 'Claro', Icon: Sun },
  { value: 'dark', label: 'Oscuro', Icon: Moon },
  { value: 'system', label: 'Sistema', Icon: Monitor },
];

export function ThemeToggle({ variant = 'icon' }: { variant?: 'icon' | 'segmented' }) {
  const { preference, resolvedTheme, setPreference, toggleTheme } = useTheme();

  if (variant === 'segmented') {
    return (
      <div
        role="radiogroup"
        aria-label="Tema de la interfaz"
        className="inline-flex rounded-lg border border-border bg-surface p-0.5"
      >
        {OPTIONS.map(({ value, label, Icon }) => {
          const active = preference === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setPreference(value)}
              className={`focus-ring inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? 'bg-[color:var(--color-primary)] text-white'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={resolvedTheme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
      title={`Tema: ${preference === 'system' ? 'sistema' : preference}`}
      className="focus-ring rounded-lg p-2 text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="h-5 w-5" aria-hidden="true" />
      ) : (
        <Moon className="h-5 w-5" aria-hidden="true" />
      )}
    </button>
  );
}
