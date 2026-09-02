/**
 * Archivo: pages/RegisterPage.tsx
 * Descripción: Página de registro de nuevo cliente (RF-001, HU-001).
 * ¿Para qué? Permitir que un dueño de mascota cree una cuenta para usar el semáforo.
 * ¿Impacto? El formulario (validación + llamado a register + casilla de aceptación de
 *   documentos legales) vive en components/auth/RegisterForm.tsx, reutilizado también
 *   por el pop-up de la navbar.
 */

import { Link } from 'react-router-dom';
import { RegisterForm } from '@/components/auth/RegisterForm';

export function RegisterPage() {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-comic tracking-wide text-gray-900 dark:text-slate-100 mb-1">
            Crear cuenta
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-brand-600 dark:text-brand-400 hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>

        <RegisterForm />
      </div>
    </div>
  );
}
