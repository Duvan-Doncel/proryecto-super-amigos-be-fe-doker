/**
 * Archivo: api/axios.ts
 * Descripción: Instancia de Axios configurada para la API del backend.
 * ¿Para qué? Centralizar la configuración HTTP: baseURL, headers, inyección del JWT
 *   y la renovación automática y transparente de la sesión (HU-006).
 * ¿Impacto? Si se usa axios directamente en los componentes, cada uno tendría
 *   que gestionar el token manualmente — este módulo lo hace una sola vez.
 */

import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiErrorResponse, ApiResponse, AuthTokens } from '@/types/auth';

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

// ¿Qué? Error de la API con el `code` interno del backend además del mensaje.
// ¿Para qué? Algunos flujos necesitan reaccionar a un código concreto —
//   p. ej. PET_CONDITION_BLOCKS_BOOKING deriva al reporte de síntoma (RF-009/RF-010).
// ¿Impacto? Sigue siendo un Error normal, así que `err.message` funciona igual que antes.
export class ApiError extends Error {
  readonly code: string | null;
  readonly status: number | null;

  constructor(message: string, code: string | null, status: number | null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ¿Qué? Interceptor de request que inyecta el Bearer token en cada llamada.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ¿Qué? Convierte un AxiosError en un ApiError con mensaje + código legibles.
function toApiError(err: AxiosError<ApiErrorResponse>): ApiError {
  const body = err.response?.data;
  const status = err.response?.status ?? null;
  if (!body) return new ApiError('No se pudo conectar con el servidor.', null, status);
  if (typeof body.error === 'string') return new ApiError(body.error, null, status);
  return new ApiError(
    body.error?.message ?? 'Ocurrió un error inesperado.',
    body.error?.code ?? null,
    status,
  );
}

// ¿Qué? Evita que múltiples requests que fallan a la vez disparen varios refresh en paralelo.
// ¿Para qué? Si 3 peticiones reciben 401 al mismo tiempo, todas esperan el MISMO refresh
//   en curso en vez de pedir 3 refresh tokens nuevos (que además rotan — RN-063).
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) throw new Error('No hay sesión activa.');

  const res = await axios.post<ApiResponse<AuthTokens>>(`${BASE_URL}/auth/refresh`, {
    refreshToken,
  });
  const tokens = res.data.data;
  localStorage.setItem('accessToken', tokens.accessToken);
  localStorage.setItem('refreshToken', tokens.refreshToken);
  return tokens.accessToken;
}

// ¿Qué? Interceptor de response — ante un 401, intenta renovar la sesión UNA vez
//   y reintenta la petición original (HU-006, CA-006.1). Si el refresh también
//   falla, limpia la sesión para que el usuario vuelva al login.
apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<ApiErrorResponse>) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;

    const isAuthEndpoint = original?.url?.includes('/auth/login') || original?.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && original && !original._retried && !isAuthEndpoint) {
      original._retried = true;
      try {
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
        const newAccessToken = await refreshPromise;
        original.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(original);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }

    return Promise.reject(toApiError(error));
  },
);
