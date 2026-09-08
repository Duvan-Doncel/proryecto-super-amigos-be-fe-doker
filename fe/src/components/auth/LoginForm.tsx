/**
 * Archivo: components/auth/LoginForm.tsx
 * Descripción: Formulario de inicio de sesión reutilizable (RF-002, HU-002).
 * ¿Para qué? El mismo formulario se usa en la página /login y en el pop-up que se abre
 *   desde la navbar — así la lógica de autenticación vive en un solo lugar.
 * ¿Impacto? No cambia la lógica de negocio: sigue llamando a `login()` del AuthContext
 *   con { email, password } igual que antes. Solo añade un aviso legal visible.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { User } from '@/types/auth';
import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/InputField';
import { Alert } from '@/components/ui/Alert';

interface FormData {
  email: string;
  password: string;
}

interface LoginFormProps {
  // ¿Qué? Se llama con el perfil del usuario tras un login correcto — quien usa el
  //   formulario decide a dónde navegar (según el rol) y si cerrar el pop-up.
  onSuccess: (profile: User) => void;
  // ¿Qué? Se llama al hacer clic en un enlace interno (recuperar contraseña, legales).
  //   Sirve para que el pop-up se cierre antes de navegar.
  onNavigate?: () => void;
}

export function LoginForm({ onSuccess, onNavigate }: LoginFormProps) {
  const { login } = useAuth();

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
      onSuccess(profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
        maxLength={255}
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
        maxLength={72}
      />

      <div className="flex justify-end">
        <Link
          to="/forgot-password"
          onClick={onNavigate}
          className="text-xs text-text-muted hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" isLoading={isLoading}>
          Iniciar sesión
        </Button>
      </div>

      {/* ¿Qué? Aviso legal visible — deja constancia de que al usar el servicio se
          aceptan los documentos, con enlace directo a cada uno. */}
      <p className="text-xs text-text-muted text-center pt-1">
        Al iniciar sesión aceptas nuestros{' '}
        <Link
          to="/terminos"
          onClick={onNavigate}
          className="text-[color:var(--color-primary)] hover:underline"
        >
          Términos y Condiciones
        </Link>{' '}
        y la{' '}
        <Link
          to="/privacidad"
          onClick={onNavigate}
          className="text-[color:var(--color-primary)] hover:underline"
        >
          Política de Privacidad
        </Link>
        .
      </p>
    </form>
  );
}
