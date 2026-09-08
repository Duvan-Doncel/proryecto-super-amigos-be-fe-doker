/**
 * Archivo: context/ToastProvider.tsx
 * Descripción: Provider + render de las notificaciones (toasts) tipo pop-up.
 * ¿Para qué? Feedback consistente de "guardado", "eliminado", "no se pudo…" en toda la
 *   app, en vez de banners inline dispersos con estado `success`/`error` por página.
 * ¿Impacto? Se monta una sola vez en App.tsx. Los toasts se anuncian a lectores de
 *   pantalla vía aria-live y se auto-cierran a los 5s.
 */

import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { ToastContext, type Toast, type ToastType } from './toast-context';

const AUTO_DISMISS_MS = 5000;

const ICONS: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const ACCENT: Record<ToastType, string> = {
  success: 'text-[color:var(--color-success)]',
  error: 'text-[color:var(--color-danger)]',
  info: 'text-[color:var(--color-info)]',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'success') => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, type, message }]);
      const timer = setTimeout(() => dismissToast(id), AUTO_DISMISS_MS);
      timers.current.set(id, timer);
      return id;
    },
    [dismissToast],
  );

  const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div
          className="fixed bottom-4 right-4 z-[60] flex w-[min(92vw,22rem)] flex-col gap-2"
          aria-live="polite"
          aria-atomic="false"
        >
          {toasts.map((toast) => {
            const Icon = ICONS[toast.type];
            return (
              <div
                key={toast.id}
                role={toast.type === 'error' ? 'alert' : 'status'}
                className="card animate-fade-in-up flex items-start gap-3 px-4 py-3 shadow-[var(--shadow-pop)]"
              >
                <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${ACCENT[toast.type]}`} aria-hidden="true" />
                <p className="flex-1 text-sm text-text">{toast.message}</p>
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  aria-label="Cerrar notificación"
                  className="focus-ring -mr-1 -mt-1 rounded p-1 text-text-muted hover:text-text"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}
