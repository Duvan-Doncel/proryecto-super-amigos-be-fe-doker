/**
 * Archivo: components/ui/Modal.tsx
 * Descripción: Ventana modal (pop-up) accesible reutilizable del design system.
 * ¿Para qué? Mostrar contenido sobre la página actual sin navegar — se usa para el
 *   pop-up de inicio de sesión / registro que se abre desde la navbar.
 * ¿Impacto? Centraliza el comportamiento accesible (cerrar con Escape, clic en el
 *   fondo, bloqueo del scroll de la página, foco inicial) para todos los modales.
 */

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  // ¿Qué? Controla si el modal está visible. Cuando es false no se renderiza nada.
  isOpen: boolean;
  // ¿Qué? Se llama cuando el usuario pide cerrar (botón X, tecla Escape o clic en el fondo).
  onClose: () => void;
  // ¿Qué? Título visible del modal — también sirve de etiqueta accesible (aria-labelledby).
  title: ReactNode;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // ¿Qué? Cierra con Escape y bloquea el scroll del fondo mientras el modal está abierto.
  // ¿Para qué? Un modal que deja hacer scroll a la página de atrás se siente roto.
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // ¿Qué? Lleva el foco al panel al abrir — para que Tab y los lectores de pantalla
    //   empiecen dentro del modal y no en la página de atrás.
    panelRef.current?.focus();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:p-6"
      onMouseDown={(e) => {
        // ¿Qué? Solo cierra si el clic empezó en el fondo, no si se arrastró desde dentro.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        className="relative w-full max-w-md my-8 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl focus:outline-none"
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 dark:border-slate-800 px-6 py-4">
          <h2
            id="modal-title"
            className="text-xl font-comic tracking-wide text-gray-900 dark:text-slate-100"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="-mr-2 -mt-1 p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
