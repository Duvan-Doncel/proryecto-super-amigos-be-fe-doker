/**
 * Archivo: pages/client/ClientHomePage.tsx
 * Descripción: Menú principal del cliente — el semáforo (RF-009, RF-010, RF-011; HU-009 a HU-011).
 * ¿Para qué? Punto de entrada desde el que el cliente elige qué necesita: una cita de
 *   grooming, reportar un síntoma leve, o ver información de emergencia.
 * ¿Impacto? Si el cliente no tiene mascotas registradas, no puede usar 🟢 ni 🟡
 *   (CA-009.2b) — el staff debe registrar al menos una primero.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserRound, PawPrint } from 'lucide-react';
import * as petsApi from '@/api/pets';
import type { Pet } from '@/types/pets';
import { useAuth } from '@/hooks/useAuth';

export function ClientHomePage() {
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[] | null>(null);

  useEffect(() => {
    petsApi
      .listMyPets()
      .then(setPets)
      .catch(() => setPets([]));
  }, []);

  const hasPets = (pets?.length ?? 0) > 0;
  const isLoadingPets = pets === null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-text">
            Hola, {user?.firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            ¿Cómo podemos ayudarte hoy? Elige según el estado de tu mascota.
          </p>
        </div>
        <Link
          to="/app/perfil"
          className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text hover:bg-surface-2"
        >
          <UserRound className="h-4 w-4" aria-hidden="true" />
          Mi perfil
          {pets && (
            <span className="ml-1 inline-flex items-center gap-0.5 rounded-full bg-surface-2 px-1.5 text-xs text-text-muted">
              <PawPrint className="h-3 w-3" aria-hidden="true" />
              {pets.length}
            </span>
          )}
        </Link>
      </div>

      {!isLoadingPets && !hasPets && (
        <div className="mb-6 rounded-lg border border-[color:var(--color-warning)]/30 bg-[color:var(--color-warning-soft)] px-4 py-3 text-sm text-text">
          Todavía no tienes mascotas registradas. Acércate o comunícate con nosotros para
          registrar a tu mascota — después podrás agendar citas y reportar síntomas.
        </div>
      )}

      <div className="grid gap-4">
        <SemaforoOption
          to="/app/cita"
          emoji="🟢"
          title="Cita de Grooming"
          description="Tu mascota está bien y quiere verse bonita."
          disabled={!hasPets}
        />
        <SemaforoOption
          to="/app/sintoma"
          emoji="🟡"
          title="Síntoma Leve"
          description="Tu mascota tiene síntomas que requieren atención."
          disabled={!hasPets}
        />
        <SemaforoOption
          to="/app/emergencia"
          emoji="🔴"
          title="Emergencia"
          description="Tu mascota necesita atención urgente."
        />
      </div>

      <div className="grid gap-4 mt-8 pt-8 border-t border-border">
        <SemaforoOption
          to="/app/tienda"
          emoji="🛍️"
          title="Tienda"
          description="Compra juguetes, accesorios y productos — paga al recogerlos en el local."
        />
      </div>
    </div>
  );
}

interface SemaforoOptionProps {
  to: string;
  emoji: string;
  title: string;
  description: string;
  disabled?: boolean;
}

function SemaforoOption({ to, emoji, title, description, disabled }: SemaforoOptionProps) {
  const content = (
    <div
      className={[
        'flex items-center gap-4 rounded-xl p-4 transition-all duration-200',
        disabled
          ? 'border border-border opacity-50 cursor-not-allowed'
          : 'card hover:-translate-y-0.5 hover:bg-surface-2',
      ].join(' ')}
    >
      <span className="text-3xl" aria-hidden="true">{emoji}</span>
      <div className="text-left">
        <p className="font-medium text-text">{title}</p>
        <p className="text-sm text-text-muted">{description}</p>
      </div>
    </div>
  );

  if (disabled) return content;

  return <Link to={to}>{content}</Link>;
}
