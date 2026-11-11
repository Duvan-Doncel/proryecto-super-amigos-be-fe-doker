import { expect, test } from '@playwright/test';

// Semana 5 · capa E2E (Álvaro): estados difíciles de provocar con el backend real en la
// pantalla "Mis mascotas" (/app/perfil/mascotas). Con page.route el navegador nunca llega
// al backend: Playwright contesta cada petición. No hace falta Docker, BD ni el API.

const API = '**/api/v1';

// ¿Qué? El cliente "logueado" que devuelve GET /users/me.
// ¿Para qué? AuthContext lee el token de localStorage y pide el perfil; con este stub la
// ruta protegida deja entrar sin hacer login de verdad.
const CLIENT = {
  id: '11111111-1111-4111-8111-111111111111',
  documentId: '1000000000',
  firstName: 'Álvaro',
  lastName: 'Prueba',
  phone: '3000000000',
  email: 'cliente.e2e@superamigos.test',
  role: 'client',
  isEmailVerified: true,
  createdAt: '2026-10-01T12:00:00.000Z',
};

function json(route, status, body) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

// ¿Qué? Prepara la sesión y los endpoints que la pantalla usa siempre.
// ¿Para qué? Cada test solo cambia la respuesta de /pets/me (la dependencia que nos interesa).
async function loginAsClient(page) {
  await page.addInitScript(() => {
    localStorage.setItem('accessToken', 'token-falso-e2e');
    localStorage.setItem('refreshToken', 'refresh-falso-e2e');
  });
  // STUB: devuelve siempre el mismo perfil; no verificamos cómo se llamó.
  await page.route(`${API}/users/me`, (route) => json(route, 200, { success: true, data: CLIENT }));
}

test.describe('Mis mascotas con el backend simulado (page.route)', () => {
  test('should show the empty state when the API returns no pets', async ({ page }) => {
    // Arrange — STUB: GET /pets/me responde una lista vacía (estado difícil de tener en la BD
    //   compartida, donde siempre hay mascotas de otros tests).
    await loginAsClient(page);
    await page.route(`${API}/pets/me`, (route) => json(route, 200, { success: true, data: [] }));

    // Act
    await page.goto('/app/perfil/mascotas');

    // Assert — ESTADO: la pantalla muestra el estado vacío y el botón para agregar
    await expect(page.getByText('Todavía no tienes mascotas registradas')).toBeVisible();
    await expect(
      page.getByText('Agrega tu primera mascota para poder agendar sus citas.'),
    ).toBeVisible();
  });

  test('should tell the user the pets could not be loaded when the API is down', async ({ page }) => {
    // Arrange — STUB: GET /pets/me responde 500, como si el backend estuviera caído.
    await loginAsClient(page);
    await page.route(`${API}/pets/me`, (route) =>
      json(route, 500, {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      }),
    );

    // Act
    await page.goto('/app/perfil/mascotas');

    // Assert — ESTADO: avisa del error y NO dice que el usuario no tiene mascotas
    // 🔎 Hallazgo: antes un 500 se mostraba como "Todavía no tienes mascotas registradas".
    await expect(page.getByRole('alert')).toContainText('No pudimos cargar tus mascotas');
    await expect(page.getByText('Todavía no tienes mascotas registradas')).toHaveCount(0);
  });

  test('should send the form data and show the validation error returned by the API', async ({
    page,
  }) => {
    // Arrange — STUB para la lista y SPY para el POST: guardamos el cuerpo que envió la
    //   pantalla para verificar después CON QUÉ datos llamó al backend.
    await loginAsClient(page);
    const sentBodies = [];
    await page.route(`${API}/pets/me`, (route) => {
      if (route.request().method() === 'POST') {
        sentBodies.push(route.request().postDataJSON());
        return json(route, 422, {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'weight: El peso debe ser mayor a 0.' },
        });
      }
      return json(route, 200, { success: true, data: [] });
    });

    await page.goto('/app/perfil/mascotas');
    await page.getByRole('button', { name: 'Agregar mascota' }).first().click();
    const dialog = page.getByRole('dialog');

    // Act: llena el formulario y lo envía
    await dialog.getByLabel('Nombre de la mascota').fill('Firulais');
    await dialog.getByLabel('Especie').selectOption('canina');
    await dialog.getByRole('button', { name: 'Registrar mascota' }).click();

    // Assert — ESTADO: el formulario sigue abierto y muestra el mensaje del API tal cual
    await expect(dialog.getByRole('alert')).toContainText('El peso debe ser mayor a 0.');
    // Assert — COMPORTAMIENTO: se llamó UNA vez al API con el nombre y la especie escritos
    expect(sentBodies).toHaveLength(1);
    expect(sentBodies[0]).toMatchObject({ name: 'Firulais', species: 'canina' });
  });
});