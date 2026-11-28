/**
 * Archivo: __tests__/pages/ChangePasswordPage.test.tsx
 * Descripción: Tests de componente del formulario de cambiar contraseña (semana 3, Juan).
 * ¿Para qué? Comprobar lo que ve y hace la persona: validaciones antes de llamar al API,
 *   mensaje de éxito y error del servidor.
 * ¿Impacto? El cliente HTTP (api/auth) y el contexto de auth se reemplazan con vi.mock.
 */

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChangePasswordPage } from '@/pages/ChangePasswordPage';
import { changePassword } from '@/api/auth';
import { mockUser, renderWithRouter } from '../helpers';

vi.mock('@/api/auth', () => ({ changePassword: vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: mockUser }) }));

const changePasswordMock = vi.mocked(changePassword);

async function fillAndSubmit(
  user: ReturnType<typeof userEvent.setup>,
  { current = 'Actual123', next = 'Nueva1234', confirm = 'Nueva1234' } = {},
) {
  await user.type(screen.getByLabelText('Contraseña actual'), current);
  await user.type(screen.getByLabelText('Nueva contraseña'), next);
  await user.type(screen.getByLabelText('Confirmar nueva contraseña'), confirm);
  await user.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));
}

describe('ChangePasswordPage', () => {
  beforeEach(() => {
    changePasswordMock.mockReset();
  });

  it('shows "Las contraseñas no coinciden." and does not call the API when the confirmation differs', async () => {
    // Arrange
    const user = userEvent.setup();
    renderWithRouter(<ChangePasswordPage />);

    // Act
    await fillAndSubmit(user, { confirm: 'Otra12345' });

    // Assert: el mensaje queda asociado al campo (aria-describedby), como lo oye un lector de pantalla
    expect(screen.getByLabelText('Confirmar nueva contraseña')).toHaveAccessibleDescription(
      'Las contraseñas no coinciden.',
    );
    expect(changePasswordMock).not.toHaveBeenCalled();
  });

  it('rejects a new password equal to the current one', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ChangePasswordPage />);

    await fillAndSubmit(user, { current: 'Igual1234', next: 'Igual1234', confirm: 'Igual1234' });

    expect(screen.getByLabelText('Nueva contraseña')).toHaveAccessibleDescription(
      'La nueva contraseña debe ser diferente a la actual.',
    );
    expect(changePasswordMock).not.toHaveBeenCalled();
  });

  it('sends both passwords and shows the success message', async () => {
    // Arrange
    const user = userEvent.setup();
    changePasswordMock.mockResolvedValue(undefined);
    renderWithRouter(<ChangePasswordPage />);

    // Act
    await fillAndSubmit(user);

    // Assert: findBy porque el mensaje aparece cuando la promesa termina
    expect(await screen.findByRole('alert')).toHaveTextContent('Contraseña cambiada correctamente.');
    expect(changePasswordMock).toHaveBeenCalledWith({
      currentPassword: 'Actual123',
      newPassword: 'Nueva1234',
    });
  });

  it('shows the server error and keeps the form when the API fails', async () => {
    const user = userEvent.setup();
    changePasswordMock.mockRejectedValue(new Error('La contraseña actual es incorrecta.'));
    renderWithRouter(<ChangePasswordPage />);

    await fillAndSubmit(user);

    expect(await screen.findByRole('alert')).toHaveTextContent('La contraseña actual es incorrecta.');
    expect(screen.getByRole('button', { name: 'Cambiar contraseña' })).toBeEnabled();
  });
});
