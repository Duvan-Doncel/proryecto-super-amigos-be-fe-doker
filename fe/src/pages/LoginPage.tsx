/**
 * Archivo: pages/LoginPage.tsx
 * Descripción: Página de inicio de sesión (RF-002, HU-002).
 * ¿Para qué? Permitir a clientes y staff autenticarse con email y contraseña.
 * ¿Impacto? Es la puerta de entrada principal al sistema.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/InputField';
import { Alert } from '@/components/ui/Alert';

interface FormData {
  email: string;
  password: string;
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormData>({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // ¿Qué? El rol del perfil decide a dónde navegar — CA-002.3/CA-002.4.
      const profile = await login(formData);
      navigate(profile.role === 'staff' ? '/staff' : '/app');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-comic tracking-wide text-gray-900 dark:text-slate-100 mb-1">
            Iniciar sesión
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-brand-600 dark:text-brand-400 hover:underline">
              Regístrate
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {error && <Alert type="error" message={error} />}

          <InputField
            id="email"
            name="email"
            label="Correo electrónico"
            type="email"
            autoComplete="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="tucorreo@ejemplo.com"
          />

          <InputField
            id="password"
            name="password"
            label="Contraseña"
            type="password"
            autoComplete="current-password"
            required
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
          />

          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-xs text-gray-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" isLoading={isLoading}>
              Iniciar sesión
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
