/**
 * Archivo: components/auth/AuthModal.tsx
 * Descripción: Pop-up que muestra el formulario de inicio de sesión o de registro.
 * ¿Para qué? Permitir autenticarse sin salir de la página actual — se abre desde los
 *   botones de la navbar y del landing.
 * ¿Impacto? Reutiliza LoginForm y RegisterForm, así que no duplica la lógica de auth.
 *   Las páginas /login y /register siguen existiendo como respaldo y para enlaces directos.
 */

import { useNavigate } from 'react-router-dom';
import { Modal } from '@/components/ui/Modal';
import { useAuthModal } from '@/hooks/useAuthModal';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

export function AuthModal() {
  const { mode, open, close } = useAuthModal();
  const navigate = useNavigate();

  const isOpen = mode !== null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={mode === 'register' ? 'Crear cuenta' : 'Iniciar sesión'}
    >
      {mode === 'register' ? (
        <>
          <RegisterForm onNavigate={close} onGoToLogin={() => open('login')} />
          <p className="mt-4 text-center text-sm text-text-muted">
            ¿Ya tienes cuenta?{' '}
            <button
              type="button"
              onClick={() => open('login')}
              className="text-[color:var(--color-primary)] hover:underline"
            >
              Inicia sesión
            </button>
          </p>
        </>
      ) : (
        <>
          <LoginForm
            onSuccess={(profile) => {
              close();
              navigate(profile.role === 'staff' ? '/staff' : '/app');
            }}
            onNavigate={close}
          />
          <p className="mt-4 text-center text-sm text-text-muted">
            ¿No tienes cuenta?{' '}
            <button
              type="button"
              onClick={() => open('register')}
              className="text-[color:var(--color-primary)] hover:underline"
            >
              Regístrate
            </button>
          </p>
        </>
      )}
    </Modal>
  );
}
