/**
 * Archivo: components/ui/Modal.tsx
 * Descripción: Ventana modal (pop-up) accesible reutilizable del design system.
 * ¿Para qué? Mostrar contenido sobre la página sin navegar — login/registro, formularios
 *   de crear/editar en el panel de staff, y confirmaciones de acciones destructivas.
 * ¿Impacto? Centraliza el comportamiento accesible: cerrar con Escape / clic en el fondo,
 *   bloqueo del scroll de fondo, foco inicial dentro del panel, TRAMPA de foco (Tab cicla
 *   dentro) y DEVOLUCIÓN del foco al elemento que abrió el modal al cerrarse.
 */

import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

type ModalSize = 'sm' | 'md' | 'lg';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  size?: ModalSize;
  // ¿Qué? Franja de acciones fija al pie (botones Guardar / Cancelar). Opcional.
  footer?: ReactNode;
}

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
};

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({ isOpen, onClose, title, children, size = 'md', footer }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  // ¿Qué? `onClose` normalmente es un arrow function inline en el caller, así que cambia de
  //   identidad en cada render del padre (p. ej. al escribir en un campo del formulario). Se
  //   guarda en un ref para que el efecto de abajo NO dependa de esa identidad — si lo hiciera,
  //   se re-ejecutaría en cada tecla y volvería a mover el foco al botón de cerrar (el primer
  //   elemento enfocable del panel), interrumpiendo la escritura.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    // ¿Qué? Recordar qué tenía el foco para devolvérselo al cerrar.
    returnFocusRef.current = document.activeElement as HTMLElement | null;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      // ¿Qué? Trampa de foco — Tab/Shift+Tab no sale del panel.
      if (e.key === 'Tab' && panelRef.current) {
        const nodes = panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE);
        if (nodes.length === 0) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // ¿Qué? Llevar el foco al primer control del panel (o al panel mismo).
    const firstFocusable = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    (firstFocusable ?? panelRef.current)?.focus();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      returnFocusRef.current?.focus?.();
    };
    // ¿Qué? Deliberadamente solo `isOpen` — ver el comentario del ref de arriba.
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        className={`animate-fade-in-up card my-8 w-full ${SIZE_CLASSES[size]} p-0 shadow-[var(--shadow-pop)] focus:outline-none`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <h2 id="modal-title" className="font-display text-lg font-bold text-text">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="focus-ring -mr-2 -mt-1 rounded-lg p-2 text-text-muted hover:bg-surface-2 hover:text-text"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="px-6 py-5">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
