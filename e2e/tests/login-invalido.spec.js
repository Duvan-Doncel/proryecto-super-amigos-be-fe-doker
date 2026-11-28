import { expect, test } from '@playwright/test';

// Flujo de Álvaro: con una contraseña incorrecta el login muestra un error y no deja entrar.
const email = 'cliente.e2e@superamigos.test';

test('should show an error and stay on /login when the password is wrong', async ({ page }) => {
  // Arrange: la persona abre la página de inicio de sesión
  await page.goto('/login');
  const form = page.getByRole('main');

  // Act: escribe su correo con una contraseña equivocada y envía el formulario
  await form.getByLabel('Correo electrónico').fill(email);
  await form.getByLabel('Contraseña', { exact: true }).fill('ClaveEquivocada123!');
  // El menú superior también tiene un botón "Iniciar sesión": se usa el del formulario
  await form.getByRole('button', { name: 'Iniciar sesión' }).click();

  // Assert: ve el mensaje de error y sigue en el login
  await expect(form.getByRole('alert')).toContainText('Credenciales inválidas');
  await expect(page).toHaveURL(/\/login$/);
}); 