/**
 * Archivo: pages/LoginPage.tsx
 * Descripción: Página de inicio de sesión (RF-002, HU-002).
 * ¿Para qué? Permitir a clientes y staff autenticarse con email y contraseña.
 * ¿Impacto? Es la puerta de entrada principal al sistema. El formulario en sí vive en
 *   components/auth/LoginForm.tsx, reutilizado también por el pop-up de la navbar.
 */

import { Link, useNavigate } from 'react-router-dom';
import { LoginForm } from '@/components/auth/LoginForm';

export function LoginPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-display tracking-wide text-text mb-1">
            Iniciar sesión
          </h1>
          <p className="text-sm text-text-muted">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-[color:var(--color-primary)] hover:underline">
              Regístrate
            </Link>
          </p>
        </div>

        <LoginForm
          onSuccess={(profile) => navigate(profile.role === 'staff' ? '/staff' : '/app')}
        />
      </div>
    </div>
  );
}
