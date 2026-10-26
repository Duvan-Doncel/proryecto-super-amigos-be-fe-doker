import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RegisterForm } from '@/components/auth/RegisterForm';

// El componente llama a register() del contexto de auth: lo reemplazamos para no tocar el API.
    const registerMock = vi.fn();
    vi.mock('@/hooks/useAuth', () => ({
    useAuth: () => ({ register: registerMock }),
    }));

    function renderForm() {
    // MemoryRouter porque el formulario tiene enlaces (Link) a términos y privacidad.
    return render(createElement(MemoryRouter, null, createElement(RegisterForm)));
    }

    async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByLabelText('Número de documento'), '1234567890');
    await user.type(screen.getByLabelText('Nombre'), 'Yesid');
    await user.type(screen.getByLabelText('Apellido'), 'Valencia');
    await user.type(screen.getByLabelText('Teléfono'), '3001234567');
    await user.type(screen.getByLabelText('Correo electrónico'), 'yesid@test.com');
    await user.type(screen.getByLabelText('Contraseña'), 'Clave123');
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'Clave123');
    }

    describe('RegisterForm', () => {
    beforeEach(() => {
        registerMock.mockReset();
    });

    it('keeps "Crear cuenta" disabled until the legal terms are accepted', async () => {
        // Arrange
        const user = userEvent.setup();
        renderForm();
        const submit = screen.getByRole('button', { name: 'Crear cuenta' });
        expect(submit).toBeDisabled();

        // Act
        await user.click(screen.getByRole('checkbox', { name: /acepto los términos/i }));

        // Assert
        expect(submit).toBeEnabled();
    });

    it('drops letters typed in the phone field', async () => {
        const user = userEvent.setup();
        renderForm();
        const phone = screen.getByLabelText('Teléfono');

        await user.type(phone, '300abc12');

        expect(phone).toHaveValue('30012');
    });

    it('shows an error and does not call the API when the phone has only 6 digits', async () => {
        // Arrange
        const user = userEvent.setup();
        renderForm();
        await fillValidForm(user);
        const phone = screen.getByLabelText('Teléfono');
        await user.clear(phone);
        await user.type(phone, '300123'); // valor límite: el mínimo es 7

        // Act
        await user.click(screen.getByRole('checkbox', { name: /acepto los términos/i }));
        await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

        // Assert
        expect(screen.getByText('El teléfono debe tener entre 7 y 15 dígitos.')).toBeInTheDocument();
        expect(registerMock).not.toHaveBeenCalled();
    });

    it('shows "Revisa tu correo" after a successful sign up', async () => {
        // Arrange
        registerMock.mockResolvedValue(undefined);
        const user = userEvent.setup();
        renderForm();
        await fillValidForm(user);

        // Act
        await user.click(screen.getByRole('checkbox', { name: /acepto los términos/i }));
        await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

        // Assert: findBy porque la pantalla de éxito aparece después de la promesa
        expect(await screen.findByRole('heading', { name: /revisa tu correo/i })).toBeInTheDocument();
        expect(registerMock).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'yesid@test.com', phone: '3001234567' }),
        );
    });

    it('shows the server error message when the sign up fails', async () => {
        registerMock.mockRejectedValue(new Error('El correo ya está registrado'));
        const user = userEvent.setup();
        renderForm();
        await fillValidForm(user);

        await user.click(screen.getByRole('checkbox', { name: /acepto los términos/i }));
        await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

        expect(await screen.findByRole('alert')).toHaveTextContent('El correo ya está registrado');
    });
    });