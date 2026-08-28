/**
 * Archivo: pages/staff/StaffCreateAccountPage.tsx
 * Descripción: Creación de una nueva cuenta de staff (RF-008, HU-008).
 * ¿Para qué? No existe registro público para staff — solo alguien que ya es staff
 *   puede dar de alta a otro miembro del equipo.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as authApi from '@/api/auth';
import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/InputField';
import { Alert } from '@/components/ui/Alert';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

const EMPTY_FORM: FormData = { firstName: '', lastName: '', email: '', password: '' };

export function StaffCreateAccountPage() {
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      await authApi.createStaff(formData);
      setSuccess(true);
      setFormData(EMPTY_FORM);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la cuenta de staff.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <Link to="/staff" className="text-sm text-gray-500 dark:text-slate-400 hover:underline">
        ← Volver
      </Link>

      <h1 className="text-2xl font-comic tracking-wide text-gray-900 dark:text-slate-100 mt-4 mb-1">
        👤 Nueva Cuenta de Staff
      </h1>
      <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
        Solo el staff puede crear otras cuentas de staff — no hay registro público para este rol.
      </p>

      {success && (
        <div className="mb-4">
          <Alert type="success" message="Cuenta de staff creada correctamente." />
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {error && <Alert type="error" message={error} />}

        <InputField
          id="firstName"
          name="firstName"
          label="Nombre"
          required
          value={formData.firstName}
          onChange={handleChange}
        />
        <InputField
          id="lastName"
          name="lastName"
          label="Apellido"
          required
          value={formData.lastName}
          onChange={handleChange}
        />
        <InputField
          id="email"
          name="email"
          label="Email"
          type="email"
          required
          value={formData.email}
          onChange={handleChange}
        />
        <InputField
          id="password"
          name="password"
          label="Contraseña"
          type="password"
          required
          value={formData.password}
          onChange={handleChange}
          placeholder="Mín. 8 caracteres, 1 mayúscula, 1 minúscula, 1 número"
        />

        <div className="flex justify-end pt-2">
          <Button type="submit" isLoading={isSubmitting}>Crear cuenta</Button>
        </div>
      </form>
    </div>
  );
}
