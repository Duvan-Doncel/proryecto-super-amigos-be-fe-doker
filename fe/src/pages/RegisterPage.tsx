/**
 * Archivo: pages/RegisterPage.tsx
 * Descripción: Página de registro de nuevo cliente (RF-001, HU-001).
 * ¿Para qué? Permitir que un dueño de mascota cree una cuenta para usar el semáforo.
 * ¿Impacto? Sin esta página no hay forma de incorporar clientes al sistema.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/InputField';
import { Alert } from '@/components/ui/Alert';

interface FormData {
  documentId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
}

type FormErrors = Partial<Record<keyof FormData, string>>;

const EMPTY_FORM: FormData = {
  documentId: '',
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export function RegisterPage() {
  const { register } = useAuth();

  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
    setServerError(null);
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (formData.documentId.trim().length < 4) {
      newErrors.documentId = 'El documento debe tener al menos 4 caracteres.';
    }
    if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'El nombre debe tener al menos 2 caracteres.';
    }
    if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'El apellido debe tener al menos 2 caracteres.';
    }
    if (formData.phone.trim().length < 7) {
      newErrors.phone = 'El teléfono es obligatorio.';
    }
    if (!formData.email.includes('@')) {
      newErrors.email = 'El correo no es válido.';
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(formData.password)) {
      newErrors.password = 'La contraseña debe tener 8+ caracteres, mayúscula, minúscula y número.';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setServerError(null);

    try {
      await register({
        documentId: formData.documentId.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
        email: formData.email,
        password: formData.password,
      });
      setRegistered(true);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'No se pudo completar el registro.');
    } finally {
      setIsLoading(false);
    }
  };

  if (registered) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm text-center space-y-4">
          <h1 className="text-2xl font-comic tracking-wide text-gray-900 dark:text-slate-100">
            ¡Ya casi! Revisa tu correo
          </h1>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            Te enviamos un enlace de verificación. Haz clic en él para activar tu cuenta
            antes de iniciar sesión.
          </p>
          <Link to="/login" className="inline-block text-sm text-brand-600 dark:text-brand-400 hover:underline">
            Ir a iniciar sesión →
          </Link>
        </div>
      </div>
    );
  }

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

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {serverError && <Alert type="error" message={serverError} />}

          <InputField
            id="documentId"
            name="documentId"
            label="Número de documento"
            type="text"
            autoComplete="off"
            required
            value={formData.documentId}
            onChange={handleChange}
            placeholder="Ej: 1234567890"
            error={errors.documentId}
          />

          <InputField
            id="firstName"
            name="firstName"
            label="Nombre"
            type="text"
            autoComplete="given-name"
            required
            value={formData.firstName}
            onChange={handleChange}
            placeholder="Ej: Juan"
            error={errors.firstName}
          />

          <InputField
            id="lastName"
            name="lastName"
            label="Apellido"
            type="text"
            autoComplete="family-name"
            required
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Ej: Pérez"
            error={errors.lastName}
          />

          <InputField
            id="phone"
            name="phone"
            label="Teléfono"
            type="tel"
            autoComplete="tel"
            required
            value={formData.phone}
            onChange={handleChange}
            placeholder="Ej: 3001234567"
            error={errors.phone}
          />

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
            error={errors.email}
          />

          <InputField
            id="password"
            name="password"
            label="Contraseña"
            type="password"
            autoComplete="new-password"
            required
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            error={errors.password}
          />

          <InputField
            id="confirmPassword"
            name="confirmPassword"
            label="Confirmar contraseña"
            type="password"
            autoComplete="new-password"
            required
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="••••••••"
            error={errors.confirmPassword}
          />

          <div className="flex justify-end pt-2">
            <Button type="submit" isLoading={isLoading}>
              Crear cuenta
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
