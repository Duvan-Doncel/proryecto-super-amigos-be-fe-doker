/**
 * Archivo: pages/staff/StaffCreateAccountPage.tsx
 * Descripción: Creación de una nueva cuenta de staff (RF-008, HU-008).
 * ¿Para qué? No existe registro público para staff — solo alguien que ya es staff
 *   puede dar de alta a otro miembro del equipo.
 */

import { useState } from 'react';
import * as authApi from '@/api/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/InputField';
import { Alert } from '@/components/ui/Alert';
import { useToast } from '@/hooks/useToast';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

const EMPTY_FORM: FormData = { firstName: '', lastName: '', email: '', password: '' };

export function StaffCreateAccountPage() {
  const { showToast } = useToast();
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await authApi.createStaff(formData);
      showToast('Cuenta de staff creada.', 'success');
      setFormData(EMPTY_FORM);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la cuenta de staff.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Nueva cuenta de staff"
        description="Solo el staff puede crear otras cuentas de staff — no hay registro público para este rol."
      />

      <Card>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {error && <Alert type="error" message={error} />}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            id="firstName"
            name="firstName"
            label="Nombre"
            required
            value={formData.firstName}
            onChange={handleChange}
            maxLength={100}
          />
          <InputField
            id="lastName"
            name="lastName"
            label="Apellido"
            required
            value={formData.lastName}
            onChange={handleChange}
            maxLength={100}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            id="email"
            name="email"
            label="Email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            maxLength={255}
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
            maxLength={72}
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" isLoading={isSubmitting}>Crear cuenta</Button>
        </div>
      </form>
      </Card>
    </div>
  );
}
