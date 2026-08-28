/**
 * Archivo: pages/ForgotPasswordPage.tsx
 * Descripción: Página para solicitar el email de recuperación de contraseña (RF-005, HU-005).
 * ¿Impacto? La respuesta siempre es genérica para no revelar si el email está registrado.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as authApi from '@/api/auth';
import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/InputField';
import { Alert } from '@/components/ui/Alert';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setEmailError(undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.includes('@')) {
      setEmailError('El correo no es válido.');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.forgotPassword({ email });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <Alert
            type="success"
            message="Si el correo está registrado, recibirás un enlace de recuperación en breve."
          />
          <div className="mt-4 flex justify-end">
            <Link to="/login" className="text-sm text-brand-600 dark:text-brand-400 hover:underline">
              Volver a iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-comic tracking-wide text-gray-900 dark:text-slate-100 mb-1">
            Recuperar contraseña
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Ingresa tu correo y te enviaremos un enlace para restablecerla.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <InputField
            id="email"
            name="email"
            label="Correo electrónico"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={handleChange}
            placeholder="tucorreo@ejemplo.com"
            error={emailError}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Link to="/login">
              <Button type="button" variant="secondary">
                Volver
              </Button>
            </Link>
            <Button type="submit" isLoading={isLoading}>
              Enviar enlace
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
