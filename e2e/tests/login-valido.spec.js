import { expect, test } from '@playwright/test';

// Flujo de Juan: una clienta con cuenta verificada inicia sesión y llega a su área.
// Requisito en la BD: una cuenta de cliente verificada (la misma que usa crear-cita.spec.js):
//   E2E_CLIENT_EMAIL / E2E_CLIENT_PASSWORD
const email = process.env.E2E_CLIENT_EMAIL ?? 'cliente.e2e@superamigos.test';
const password = process.env.E2E_CLIENT_PASSWORD ?? 'ClienteE2e123!';

test('should take a verified client to her home after a valid login', async ({ page }) => {
  // Arrange: la clienta abre la página de inicio de sesión
  await page.goto('/login');

  // Act: escribe su correo y su contraseña y envía el formulario
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  // El menú superior también tiene un botón "Iniciar sesión": se envía el formulario con Enter
  await page.getByLabel('Contraseña', { exact: true }).press('Enter');

  // Assert: llega a /app y ve su saludo (Playwright espera solo, sin waitForTimeout)
  await expect(page).toHaveURL(/\/app/);
  await expect(page.getByRole('heading', { name: /^Hola,/ })).toBeVisible();
});
