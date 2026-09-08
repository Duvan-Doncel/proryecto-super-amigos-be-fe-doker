/**
 * Archivo: components/ui/ConfirmDialog.tsx
 * Descripción: Pop-up de confirmación para acciones destructivas o sensibles.
 * ¿Para qué? Antes, "Eliminar" / "Desactivar" se ejecutaban al primer clic. Este diálogo
 *   obliga a confirmar y comunica la consecuencia antes de actuar.
 * ¿Impacto? Construido sobre <Modal>, así que hereda foco atrapado y cierre accesible.
 */

import type { ReactNode } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  // ¿Qué? 'danger' pinta el botón de rojo (borrar); 'primary' para confirmaciones neutras.
  tone?: 'danger' | 'primary';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} isLoading={isLoading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-text-muted">{message}</p>
    </Modal>
  );
}
