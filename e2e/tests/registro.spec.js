import { expect, test } from '@playwright/test';

// Flujo de Yesid: una persona nueva crea su cuenta y ve el aviso para verificar su correo.
test('should ask to verify the email after creating an account', async ({ page }) => {
  // Arrange: datos únicos porque la BD conserva los registros entre ejecuciones
  const unique = String(Date.now());
  const email = `yesid.e2e.${unique}@superamigos.test`;
  await page.goto('/');
  await page.getByRole('banner').getByRole('button', { name: 'Crear cuenta' }).click();
  const form = page.getByRole('dialog', { name: 'Crear cuenta' });

  // Act: llena el formulario y crea la cuenta
  await form.getByLabel('Número de documento').fill(unique.slice(-10));
  await form.getByLabel('Nombre').fill('Yesid');
  await form.getByLabel('Apellido').fill('Prueba');
  await form.getByLabel('Teléfono').fill(`3${unique.slice(-9)}`);
  await form.getByLabel('Correo electrónico').fill(email);
  await form.getByLabel('Contraseña', { exact: true }).fill('Clave.Segura123');
  await form.getByLabel('Confirmar contraseña').fill('Clave.Segura123');
  await form.getByRole('checkbox', { name: /acepto los Términos/ }).check();
  await form.getByRole('button', { name: 'Crear cuenta' }).click();

  // Assert: la persona ve el aviso de revisar su correo
 await expect(page.getByText(/revisa tu correo/i)).toBeVisible();
});