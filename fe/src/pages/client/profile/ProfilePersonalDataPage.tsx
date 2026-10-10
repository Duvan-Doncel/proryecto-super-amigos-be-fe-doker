/**
 * Archivo: pages/client/profile/ProfilePersonalDataPage.tsx
 * Descripción: Sección "Datos personales" del perfil de cliente (RF-007).
 * ¿Para qué? Separada del resto del perfil — el cliente ve y edita SOLO su información de
 *   cuenta aquí, sin que compita visualmente con mascotas, citas o historial.
 */

import { useEffect, useState } from 'react';
import { BadgeCheck, Pencil } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import * as authApi from '@/api/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { InputField } from '@/components/ui/InputField';
import { Alert } from '@/components/ui/Alert';

function EditProfileModal({
  isOpen,
  onClose,
  initial,
}: {
  isOpen: boolean;
  onClose: () => void;
  initial: { firstName: string; lastName: string; phone: string };
}) {
  const { refreshUser } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(initial);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await authApi.updateMe({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
      });
      await refreshUser();
      showToast('Datos actualizados.', 'success');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar datos personales"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button form="edit-profile-form" type="submit" isLoading={saving}>
            Guardar cambios
          </Button>
        </>
      }
    >
      <form id="edit-profile-form" onSubmit={submit} noValidate className="space-y-4">
        {error && <Alert type="error" message={error} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            id="firstName"
            label="Nombre"
            value={form.firstName}
            onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
            required
          />
          <InputField
            id="lastName"
            label="Apellido"
            value={form.lastName}
            onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
            required
          />
        </div>
        <InputField
          id="phone"
          label="Teléfono"
          type="tel"
          inputMode="numeric"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          required
        />
        <p className="text-xs text-text-muted">Para cambiar tu correo o documento, contáctanos.</p>
      </form>
    </Modal>
  );
}

export function ProfilePersonalDataPage() {
  const { user } = useAuth();
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Datos personales"
        description="Tu información de cuenta — nombre, documento, correo y teléfono de contacto."
      />

      <Card>
        <CardHeader
          title="Información de cuenta"
          actions={
            <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => setEditOpen(true)}>
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Editar
            </Button>
          }
        />
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <Field label="Nombre" value={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()} />
          <Field label="Documento" value={user?.documentId ?? '—'} />
          <div className="sm:col-span-2">
            <dt className="text-xs text-text-muted">Correo</dt>
            <dd className="mt-0.5 flex flex-wrap items-center gap-1.5 text-sm text-text">
              <span className="break-all">{user?.email}</span>
              {user?.isEmailVerified && (
                <span className="inline-flex items-center gap-0.5 text-xs text-[color:var(--color-success)]">
                  <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" /> verificado
                </span>
              )}
            </dd>
          </div>
          <Field label="Teléfono" value={user?.phone ?? '—'} />
          <Field
            label="Cliente desde"
            value={
              user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString('es-CO', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : '—'
            }
          />
        </dl>
      </Card>

      <EditProfileModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        initial={{
          firstName: user?.firstName ?? '',
          lastName: user?.lastName ?? '',
          phone: user?.phone ?? '',
        }}
      />
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-text">{value || '—'}</dd>
    </div>
  );
}
