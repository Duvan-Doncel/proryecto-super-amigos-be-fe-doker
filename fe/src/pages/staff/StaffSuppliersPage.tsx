/**
 * Archivo: pages/staff/StaffSuppliersPage.tsx
 * Descripción: Gestión de proveedores (RF-020, HU-020).
 * ¿Para qué? Sin proveedores registrados no se puede generar un pedido de
 *   reabastecimiento (RF-021).
 * ¿Impacto? "Eliminar" desactiva el proveedor si ya tiene pedidos asociados (RN-202).
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as suppliersApi from '@/api/suppliers';
import type { Supplier } from '@/types/suppliers';
import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/InputField';
import { Alert } from '@/components/ui/Alert';

interface FormData {
  name: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
}

const EMPTY_FORM: FormData = { name: '', contactName: '', phone: '', email: '', address: '' };

export function StaffSuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadSuppliers = () => suppliersApi.listSuppliers().then(setSuppliers);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      await suppliersApi.createSupplier({
        name: formData.name,
        contactName: formData.contactName || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        address: formData.address || undefined,
      });
      setSuccess(true);
      setFormData(EMPTY_FORM);
      loadSuppliers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el proveedor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleActive = async (supplier: Supplier) => {
    setBusyId(supplier.id);
    setError(null);
    try {
      await suppliersApi.updateSupplier(supplier.id, { active: !supplier.active });
      loadSuppliers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el proveedor.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (supplier: Supplier) => {
    setBusyId(supplier.id);
    setError(null);
    try {
      await suppliersApi.deleteSupplier(supplier.id);
      loadSuppliers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el proveedor.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <Link to="/staff" className="text-sm text-gray-500 dark:text-slate-400 hover:underline">
        ← Volver
      </Link>

      <h1 className="text-2xl font-comic tracking-wide text-gray-900 dark:text-slate-100 mt-4 mb-6">
        📦 Proveedores
      </h1>

      {success && (
        <div className="mb-4">
          <Alert type="success" message="Proveedor creado correctamente." />
        </div>
      )}
      {error && (
        <div className="mb-4">
          <Alert type="error" message={error} />
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4 mb-10">
        <InputField
          id="name"
          name="name"
          label="Nombre del proveedor"
          required
          value={formData.name}
          onChange={handleChange}
          placeholder="Ej: Distribuidora Mascotas SAS"
        />
        <InputField
          id="contactName"
          name="contactName"
          label="Nombre de contacto (opcional)"
          value={formData.contactName}
          onChange={handleChange}
        />
        <InputField
          id="phone"
          name="phone"
          label="Teléfono (opcional)"
          value={formData.phone}
          onChange={handleChange}
        />
        <InputField
          id="email"
          name="email"
          label="Email (opcional)"
          type="email"
          value={formData.email}
          onChange={handleChange}
        />
        <InputField
          id="address"
          name="address"
          label="Dirección (opcional)"
          value={formData.address}
          onChange={handleChange}
        />

        <div className="flex justify-end pt-2">
          <Button type="submit" isLoading={isSubmitting}>Crear proveedor</Button>
        </div>
      </form>

      <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-3">Proveedores existentes</h2>
      {suppliers.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-slate-400">Todavía no hay proveedores registrados.</p>
      ) : (
        <ul className="space-y-2">
          {suppliers.map((s) => (
            <li
              key={s.id}
              className={`rounded-lg border px-4 py-3 text-sm ${
                s.active
                  ? 'border-gray-200 dark:border-slate-700'
                  : 'border-gray-200 dark:border-slate-700 opacity-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900 dark:text-slate-100">{s.name}</span>
                <span className="text-xs text-gray-500 dark:text-slate-400">
                  {s.active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              {(s.contactName || s.phone || s.email) && (
                <p className="text-gray-500 dark:text-slate-400">
                  {[s.contactName, s.phone, s.email].filter(Boolean).join(' — ')}
                </p>
              )}
              <div className="flex gap-2 mt-2">
                <Button
                  variant="secondary"
                  className="text-xs px-3 py-1.5"
                  isLoading={busyId === s.id}
                  onClick={() => toggleActive(s)}
                >
                  {s.active ? 'Desactivar' : 'Activar'}
                </Button>
                <Button
                  variant="danger"
                  className="text-xs px-3 py-1.5"
                  isLoading={busyId === s.id}
                  onClick={() => handleDelete(s)}
                >
                  Eliminar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
