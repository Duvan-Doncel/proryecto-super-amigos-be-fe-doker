import { expect, test } from '@playwright/test';

// Flujo de Santiago: una clienta agenda una cita de grooming y la ve en "Mis citas".
// Requisitos en la BD de pruebas (el login exige correo verificado, por eso no se registra aquí):
//   - una cuenta de cliente verificada: E2E_CLIENT_EMAIL / E2E_CLIENT_PASSWORD
//   - al menos un servicio activo (lo crea el staff en /staff/servicios)
const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3000/api/v1';
const email = process.env.E2E_CLIENT_EMAIL ?? 'cliente.e2e@superamigos.test';
const password = process.env.E2E_CLIENT_PASSWORD ?? 'ClienteE2e123!';

test('should show the new appointment in "Mis citas" after booking it', async ({ page, request }) => {
  // Arrange: mascota con nombre único (la BD conserva datos entre ejecuciones),
  // creada por la API para no depender del formulario de mascotas
  const pet = `Firulais E2E ${Date.now()}`;
  const login = await request.post(`${API_URL}/auth/login`, { data: { email, password } });
  expect(login.ok()).toBeTruthy();
  const { accessToken } = (await login.json()).data;
  const created = await request.post(`${API_URL}/pets/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: { name: pet, species: 'canina' },
  });
  expect(created.ok()).toBeTruthy();

  // Día del mes siguiente que varía en cada ejecución: hay tope de 10 citas por día
  const day = (Math.floor(Date.now() / 1000) % 28) + 1;

  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  
    // El menú superior también tiene un botón "Iniciar sesión": se envía el formulario con Enter
  await page.getByLabel('Contraseña', { exact: true }).press('Enter');
  await expect(page).toHaveURL(/\/app/);
  await page.goto('/app/cita');

  // Act: la clienta elige mascota, servicio, día y hora, y agenda
  await page.getByLabel('Mascota').selectOption({ label: pet });
  await page.getByLabel('Servicio').selectOption({ index: 1 });
  await page.getByRole('button', { name: 'Mes siguiente' }).click();
  await page.getByRole('button', { name: new RegExp(`^${day} de `) }).click();
  await page.getByLabel('Hora (entre 9:00am y 6:00pm)').fill('10:00');
  await page.getByRole('button', { name: 'Agendar cita' }).click();

  // Assert: ve la confirmación y su cita en la lista (Playwright espera solo, sin waitForTimeout)
  await expect(page.getByRole('alert')).toContainText('¡Cita agendada!');
  await expect(page.getByRole('listitem').filter({ hasText: pet })).toBeVisible();
});