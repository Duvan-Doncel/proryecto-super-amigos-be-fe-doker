/**
 * Archivo: pages/staff/StaffProductsPage.tsx
 * Descripción: Catálogo de productos en venta (RF-015, HU-015).
 * ¿Para qué? El staff crea y edita productos, precio y stock — sin un producto activo
 *   con stock, los clientes no pueden pedirlo (RF-016).
 * ¿Impacto? "Eliminar" desactiva el producto si ya tiene pedidos/ventas asociadas
 *   (RN-153), en vez de borrarlo, para no perder el historial.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as productsApi from '@/api/products';
import type { Product } from '@/types/products';
import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/InputField';
import { Alert } from '@/components/ui/Alert';

interface FormData {
  name: string;
  description: string;
  price: string;
  stock: string;
  category: string;
}

const EMPTY_FORM: FormData = { name: '', description: '', price: '', stock: '', category: '' };

export function StaffProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadProducts = () => productsApi.listProductsForStaff(false).then(setProducts);

  useEffect(() => {
    loadProducts();
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
      await productsApi.createProduct({
        name: formData.name,
        description: formData.description || undefined,
        price: Number(formData.price),
        stock: formData.stock ? Number(formData.stock) : undefined,
        category: formData.category || undefined,
      });
      setSuccess(true);
      setFormData(EMPTY_FORM);
      loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el producto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleActive = async (product: Product) => {
    setBusyId(product.id);
    setError(null);
    try {
      await productsApi.updateProduct(product.id, { active: !product.active });
      loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el producto.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (product: Product) => {
    setBusyId(product.id);
    setError(null);
    try {
      await productsApi.deleteProduct(product.id);
      loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el producto.');
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
        🛒 Catálogo de Productos
      </h1>

      {success && (
        <div className="mb-4">
          <Alert type="success" message="Producto creado correctamente." />
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
          label="Nombre del producto"
          required
          value={formData.name}
          onChange={handleChange}
          placeholder="Ej: Correa para perro"
        />
        <InputField
          id="description"
          name="description"
          label="Descripción (opcional)"
          value={formData.description}
          onChange={handleChange}
        />
        <InputField
          id="category"
          name="category"
          label="Categoría (opcional)"
          value={formData.category}
          onChange={handleChange}
          placeholder="Ej: Juguetes, Accesorios, Medicamentos"
        />
        <InputField
          id="price"
          name="price"
          label="Precio (COP)"
          type="number"
          min={1}
          required
          value={formData.price}
          onChange={handleChange}
        />
        <InputField
          id="stock"
          name="stock"
          label="Stock inicial"
          type="number"
          min={0}
          value={formData.stock}
          onChange={handleChange}
          placeholder="0"
        />

        <div className="flex justify-end pt-2">
          <Button type="submit" isLoading={isSubmitting}>Crear producto</Button>
        </div>
      </form>

      <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-3">Productos existentes</h2>
      {products.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-slate-400">Todavía no hay productos registrados.</p>
      ) : (
        <ul className="space-y-2">
          {products.map((p) => (
            <li
              key={p.id}
              className={`rounded-lg border px-4 py-3 text-sm ${
                p.active
                  ? 'border-gray-200 dark:border-slate-700'
                  : 'border-gray-200 dark:border-slate-700 opacity-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900 dark:text-slate-100">
                  {p.name} — ${p.price.toLocaleString('es-CO')}
                </span>
                <span className="text-xs text-gray-500 dark:text-slate-400">
                  {p.active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <p className="text-gray-500 dark:text-slate-400">
                Stock: {p.stock}{p.category ? ` — ${p.category}` : ''}
              </p>
              <div className="flex gap-2 mt-2">
                <Button
                  variant="secondary"
                  className="text-xs px-3 py-1.5"
                  isLoading={busyId === p.id}
                  onClick={() => toggleActive(p)}
                >
                  {p.active ? 'Desactivar' : 'Activar'}
                </Button>
                <Button
                  variant="danger"
                  className="text-xs px-3 py-1.5"
                  isLoading={busyId === p.id}
                  onClick={() => handleDelete(p)}
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
