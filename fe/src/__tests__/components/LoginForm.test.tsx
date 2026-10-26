/**
 * Archivo: __tests__/components/LoginForm.test.tsx
 * Descripción: Tests del componente LoginForm (semana 3, capa Front).
 * ¿Para qué? Verificar lo que ve y hace el usuario en el formulario de login: enviar sus
 *   datos, ver el error si falla, el botón bloqueado mientras carga y el error que se
 *   limpia al volver a escribir.
 * ¿Impacto? Es la puerta de entrada de clientes y staff: si falla, nadie entra.
 * Autor: Álvaro Espejo
 */

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { LoginForm } from '@/components/auth/LoginForm';
import { renderWithRouter, mockUser } from '../helpers';

// ¿Qué? Mock del hook useAuth: así controlamos lo que responde login() sin llamar al API.
vi.mock('@/hooks/useAuth');
import { useAuth } from '@/hooks/useAuth';
import type { AuthContextValue } from '@/context/auth-context';

const mockUseAuth = vi.mocked(useAuth);

// ¿Qué? Configura useAuth con la función login que necesita cada test.
function setupAuth(login: AuthContextValue['login']) {
  mockUseAuth.mockReturnValue({
    isAuthenticated: false,
    isLoading: false,
    user: null,
    login,
    register: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
  });
}

// ¿Qué? Escribe correo y contraseña y hace clic en "Iniciar sesión", como lo haría el usuario.
async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Correo electrónico'), 'cliente@superamigos.test');
  await user.type(screen.getByLabelText('Contraseña'), 'Clave123!');
  await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
}

describe('LoginForm', () => {
  it('envía el correo y la contraseña y avisa con el perfil cuando el login es correcto', async () => {
    // Arrange
    const login = vi.fn().mockResolvedValue(mockUser);
    const onSuccess = vi.fn();
    setupAuth(login);
    const user = userEvent.setup();
    renderWithRouter(<LoginForm onSuccess={onSuccess} />);

    // Act
    await fillAndSubmit(user);

    // Assert
    expect(login).toHaveBeenCalledWith({
      email: 'cliente@superamigos.test',
      password: 'Clave123!',
    });
    expect(onSuccess).toHaveBeenCalledWith(mockUser);
  });

  it('muestra el mensaje de error cuando las credenciales son incorrectas', async () => {
    // Arrange
    const login = vi.fn().mockRejectedValue(new Error('Credenciales inválidas.'));
    const onSuccess = vi.fn();
    setupAuth(login);
    const user = userEvent.setup();
    renderWithRouter(<LoginForm onSuccess={onSuccess} />);

    // Act
    await fillAndSubmit(user);

    // Assert
    // ¿Qué? findByRole espera a que aparezca: el error llega después de la promesa.
    expect(await screen.findByRole('alert')).toHaveTextContent('Credenciales inválidas.');
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('deshabilita el botón mientras espera la respuesta del servidor', async () => {
    // Arrange
    // ¿Qué? Una promesa que nunca se resuelve deja el formulario "cargando".
    const login = vi.fn().mockReturnValue(new Promise(() => {}));
    setupAuth(login);
    const user = userEvent.setup();
    renderWithRouter(<LoginForm onSuccess={vi.fn()} />);
    const button = screen.getByRole('button', { name: 'Iniciar sesión' });

    // Act
    await fillAndSubmit(user);

    // Assert
    expect(button).toBeDisabled();
  });

  it('borra el mensaje de error cuando el usuario vuelve a escribir', async () => {
    // Arrange
    const login = vi.fn().mockRejectedValue(new Error('Credenciales inválidas.'));
    setupAuth(login);
    const user = userEvent.setup();
    renderWithRouter(<LoginForm onSuccess={vi.fn()} />);
    await fillAndSubmit(user);
    await screen.findByRole('alert');

    // Act
    await user.type(screen.getByLabelText('Contraseña'), 'x');

    // Assert
    // ¿Qué? queryByRole devuelve null en vez de fallar: sirve para comprobar que algo NO está.
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});