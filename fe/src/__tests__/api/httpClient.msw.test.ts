/**
 * Archivo: __tests__/api/httpClient.msw.test.ts
 * Descripción: Tests del cliente HTTP (api/axios.ts + api/pets.ts) con MSW (semana 5, Juan).
 * ¿Para qué? El backend es una dependencia que el frontend no controla: puede responder bien,
 *   caerse (500), rechazar datos (422), devolver HTML en vez de JSON o pedir renovar la sesión.
 *   MSW intercepta las peticiones de red y responde lo que cada test necesita.
 * ¿Impacto? Se prueba el cliente real (axios, interceptores, toApiError) sin levantar el backend.
 *   Si alguien rompe el manejo de errores, la pantalla mostraría mensajes crudos y estos tests fallan.
 */

import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/api/axios';
import { listMyPets } from '@/api/pets';

// ¿Qué? `*/` antepuesto a la ruta: así el handler funciona con o sin VITE_API_BASE_URL (en CI no hay .env).
const PETS_URL = '*/pets/me';
const REFRESH_URL = '*/auth/refresh';

const PET = { id: 'p-1', name: 'Firulais', species: 'canina', skinConditions: [] };

// ¿Qué? Servidor falso de red. Tipo de doble: STUB — cada handler devuelve una respuesta fija.
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('accessToken', 'token-viejo');
  localStorage.setItem('refreshToken', 'refresh-1');
});

describe('cliente HTTP — caso feliz', () => {
  it('devuelve la lista de mascotas y envía el token Bearer guardado', async () => {
    // Tipo de doble: SPY — el handler guarda el header que llegó para revisarlo después.
    let authHeader: string | null = null;
    server.use(
      http.get(PETS_URL, ({ request }) => {
        authHeader = request.headers.get('Authorization');
        return HttpResponse.json({ success: true, data: [PET] });
      }),
    );

    const pets = await listMyPets();

    // Estado: lo que devuelve la función es exactamente `data` del cuerpo.
    expect(pets).toEqual([PET]);
    // Comportamiento: el interceptor de request inyectó el token.
    expect(authHeader).toBe('Bearer token-viejo');
  });
});

describe('cliente HTTP — errores del backend', () => {
  it('convierte un 500 en ApiError con el mensaje y el código del backend', async () => {
    // Tipo de doble: STUB — el backend "se cae" con el formato de error del proyecto.
    server.use(
      http.get(PETS_URL, () =>
        HttpResponse.json(
          { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
          { status: 500 },
        ),
      ),
    );

    const err = await listMyPets().catch((e: unknown) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ message: 'Internal server error', code: 'INTERNAL_ERROR', status: 500 });
  });

  it('convierte un 422 en ApiError con el mensaje de validación que muestra el formulario', async () => {
    // Tipo de doble: STUB — respuesta de validación igual a la de validate.middleware.ts.
    server.use(
      http.get(PETS_URL, () =>
        HttpResponse.json(
          {
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'name: El nombre de la mascota es requerido.' },
          },
          { status: 422 },
        ),
      ),
    );

    await expect(listMyPets()).rejects.toMatchObject({
      name: 'ApiError',
      code: 'VALIDATION_ERROR',
      status: 422,
      message: 'name: El nombre de la mascota es requerido.',
    });
  });

  it('con una respuesta que no es JSON (HTML de un proxy) da un mensaje genérico, no el HTML', async () => {
    // Tipo de doble: STUB — un 502 en HTML, como el de un proxy o un servidor caído.
    server.use(
      http.get(PETS_URL, () =>
        HttpResponse.text('<html><body><h1>502 Bad Gateway</h1></body></html>', {
          status: 502,
          headers: { 'Content-Type': 'text/html' },
        }),
      ),
    );

    const err = (await listMyPets().catch((e: unknown) => e)) as ApiError;

    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(502);
    expect(err.message).toBe('Ocurrió un error inesperado.');
    expect(err.message).not.toMatch(/<html|Bad Gateway/);
  });
});

describe('cliente HTTP — sesión vencida (401)', () => {
  it('renueva el token una sola vez y reintenta la petición con el token nuevo', async () => {
    // Tipo de doble: MOCK — vi.fn cuenta las llamadas al refresh para verificar el comportamiento.
    const refreshSpy = vi.fn();
    const seenTokens: (string | null)[] = [];
    server.use(
      http.get(PETS_URL, ({ request }) => {
        const auth = request.headers.get('Authorization');
        seenTokens.push(auth);
        if (auth === 'Bearer token-viejo') {
          return HttpResponse.json(
            { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } },
            { status: 401 },
          );
        }
        return HttpResponse.json({ success: true, data: [PET] });
      }),
      http.post(REFRESH_URL, async ({ request }) => {
        refreshSpy(await request.json());
        return HttpResponse.json({
          success: true,
          data: { accessToken: 'token-nuevo', refreshToken: 'refresh-2' },
        });
      }),
    );

    const pets = await listMyPets();

    expect(pets).toEqual([PET]);
    expect(refreshSpy).toHaveBeenCalledTimes(1);
    expect(refreshSpy).toHaveBeenCalledWith({ refreshToken: 'refresh-1' });
    expect(seenTokens).toEqual(['Bearer token-viejo', 'Bearer token-nuevo']);
    // Estado: la sesión nueva quedó guardada.
    expect(localStorage.getItem('accessToken')).toBe('token-nuevo');
    expect(localStorage.getItem('refreshToken')).toBe('refresh-2');
  });

  it('si no hay refresh token, no llama al refresh y borra la sesión', async () => {
    localStorage.removeItem('refreshToken');
    // Tipo de doble: MOCK — verifica que el refresh NO se llama.
    const refreshSpy = vi.fn();
    server.use(
      http.get(PETS_URL, () =>
        HttpResponse.json(
          { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } },
          { status: 401 },
        ),
      ),
      http.post(REFRESH_URL, () => {
        refreshSpy();
        return HttpResponse.json({}, { status: 500 });
      }),
    );

    await expect(listMyPets()).rejects.toMatchObject({ status: 401, code: 'UNAUTHORIZED' });

    expect(refreshSpy).not.toHaveBeenCalled();
    expect(localStorage.getItem('accessToken')).toBeNull();
  });
});
