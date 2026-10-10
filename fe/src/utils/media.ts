/**
 * Archivo: utils/media.ts
 * Descripción: Resuelve rutas de archivos estáticos servidos por el backend (fotos de
 *   mascota) a una URL absoluta.
 * ¿Para qué? El backend guarda `photoUrl` como ruta relativa (`/uploads/pets/xxx.jpg`),
 *   servida por Express en la raíz del backend — NO bajo `/api/v1`. `VITE_API_BASE_URL`
 *   sí incluye `/api/v1`, así que hay que recortarlo antes de anteponerlo.
 */

const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL as string).replace(/\/api\/v1\/?$/, '');

export function resolveUploadUrl(relativeUrl: string | null | undefined): string | null {
  if (!relativeUrl) return null;
  return `${API_ORIGIN}${relativeUrl}`;
}
