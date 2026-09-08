/**
 * Archivo: pages/client/EmergencyPage.tsx
 * Descripción: Emergencia — veterinarias cercanas (RF-011, HU-011).
 * ¿Para qué? GroomingSpa no atiende emergencias — esta pantalla solo informa,
 *   nunca crea citas ni reportes (CA-011.1).
 */

import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import * as emergencyApi from '@/api/emergency';
import type { EmergencyInfo } from '@/types/emergency';

// ¿Qué? Clave de la API de mapas leída de una variable de entorno — nunca hardcodeada
//   directamente en el componente (RN-113, corrige el hallazgo de seguridad del código anterior).
const MAPS_API_KEY = import.meta.env.VITE_MAPS_API_KEY as string | undefined;

export function EmergencyPage() {
  const [info, setInfo] = useState<EmergencyInfo | null>(null);

  useEffect(() => {
    emergencyApi.getEmergencyInfo().then(setInfo);
  }, []);

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <Link to="/app" className="text-sm text-text-muted hover:underline">
        ← Volver
      </Link>

      <h1 className="text-2xl font-display tracking-wide text-text mt-4 mb-1">
        🔴 Emergencia — Veterinarias Cercanas
      </h1>
      <p className="text-sm text-text-muted mb-6">
        GroomingSpa no atiende emergencias médicas. Aquí tienes veterinarias cercanas y
        números de contacto inmediato.
      </p>

      {info && MAPS_API_KEY ? (
        <div className="mb-6">
          <iframe
            title="Veterinarias cercanas"
            width="100%"
            height="300"
            style={{ border: 0, borderRadius: '12px' }}
            loading="lazy"
            src={`https://www.google.com/maps/embed/v1/search?key=${MAPS_API_KEY}&q=${encodeURIComponent(info.searchQuery)}`}
          />
        </div>
      ) : (
        <div className="mb-6 rounded-lg border border-border px-4 py-3 text-sm text-text-muted">
          Mapa no disponible (falta configurar VITE_MAPS_API_KEY en el .env).
        </div>
      )}

      <h2 className="text-lg font-semibold text-text mb-3">
        📞 Números de emergencia
      </h2>
      <ul className="space-y-2">
        {(info?.emergencyPhones ?? []).map((p) => (
          <li
            key={p.phone}
            className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm"
          >
            <span className="text-text">{p.label}</span>
            <a href={`tel:${p.phone}`} className="font-semibold text-[color:var(--color-primary)]">
              {p.phone}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
