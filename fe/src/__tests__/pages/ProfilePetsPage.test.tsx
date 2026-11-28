/**
 * Archivo: __tests__/pages/ProfilePetsPage.test.tsx
 * Descripción: Tests del popup de resultado al registrar una mascota (RF-012).
 * ¿Para qué? Verificar que el cliente siempre ve si la mascota se guardó y, si no, por qué.
 */

import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ProfilePetsPage } from '@/pages/client/profile/ProfilePetsPage';
import { ToastProvider } from '@/context/ToastProvider';
import { renderWithRouter } from '../helpers';
import type { Pet } from '@/types/pets';

vi.mock('@/api/pets');
import * as petsApi from '@/api/pets';

const luna: Pet = {
  id: 'pet-1', clientId: 'user-test-id-1', name: 'Luna', species: 'canina',
  breed: 'Poodle', gender: null, age: 3, weight: 8, color: null, size: 'pequeno',
  coatType: null, behavior: null, skinConditions: [], pathology: '',
  photoUrl: null, createdAt: '2026-01-01T00:00:00Z',
};

beforeEach(() => {
  vi.mocked(petsApi.listMyPets).mockResolvedValue([]);
});

afterEach(() => {
  vi.clearAllMocks();
});

async function openAndFill(user: ReturnType<typeof userEvent.setup>) {
  renderWithRouter(
    <ToastProvider>
      <ProfilePetsPage />
    </ToastProvider>,
  );
  await user.click((await screen.findAllByRole('button', { name: /agregar mascota/i }))[0]);
  const form = within(screen.getByRole('dialog'));
  await user.type(form.getByLabelText('Nombre de la mascota'), 'Luna');
  await user.selectOptions(form.getByLabelText('Especie'), 'canina');
}

describe('ProfilePetsPage — popup de resultado', () => {
  it('si la mascota se registra, el popup lo confirma con su ficha', async () => {
    // Arrange
    vi.mocked(petsApi.createMyPet).mockResolvedValue(luna);
    const user = userEvent.setup();
    await openAndFill(user);

    // Act
    await user.click(screen.getByRole('button', { name: 'Registrar mascota' }));

    // Assert
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('¡Listo! Registramos a Luna');
    expect(dialog).toHaveTextContent('Poodle');
    expect(screen.getByRole('button', { name: 'Agendar su primera cita' })).toBeInTheDocument();
  });

  it('si el backend rechaza la mascota, el popup muestra el motivo y el formulario vuelve con los datos', async () => {
    // Arrange
    vi.mocked(petsApi.createMyPet).mockRejectedValue(new Error('El peso debe ser mayor a 0.'));
    const user = userEvent.setup();
    await openAndFill(user);

    // Act
    await user.click(screen.getByRole('button', { name: 'Registrar mascota' }));

    // Assert — popup con el motivo; al corregir, el nombre escrito sigue ahí.
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('No se pudo guardar la mascota');
    expect(dialog).toHaveTextContent('El peso debe ser mayor a 0.');
    await user.click(screen.getByRole('button', { name: 'Corregir' }));
    expect(await screen.findByLabelText('Nombre de la mascota')).toHaveValue('Luna');
  });
});
