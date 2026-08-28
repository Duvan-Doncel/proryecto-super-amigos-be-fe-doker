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
      <Link to="/app" className="text-sm text-gray-500 dark:text-slate-400 hover:underline">
        ← Volver
      </Link>

      <h1 className="text-2xl font-comic tracking-wide text-gray-900 dark:text-slate-100 mt-4 mb-1">
        🔴 Emergencia — Veterinarias Cercanas
      </h1>
      <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
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
        <div className="mb-6 rounded-lg border border-gray-200 dark:border-slate-700 px-4 py-3 text-sm text-gray-500 dark:text-slate-400">
          Mapa no disponible (falta configurar VITE_MAPS_API_KEY en el .env).
        </div>
      )}

      <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-3">
        📞 Números de emergencia
      </h2>
      <ul className="space-y-2">
        {(info?.emergencyPhones ?? []).map((p) => (
          <li
            key={p.phone}
            className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-slate-700 px-4 py-3 text-sm"
          >
            <span className="text-gray-700 dark:text-slate-300">{p.label}</span>
            <a href={`tel:${p.phone}`} className="font-semibold text-brand-600 dark:text-brand-400">
              {p.phone}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
