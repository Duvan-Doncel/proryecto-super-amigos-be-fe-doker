/**
 * Archivo: pages/staff/StaffProductsPage.tsx
 * Descripción: Catálogo de productos en venta (RF-015, HU-015).
 * ¿Para qué? El staff crea y edita productos, precio y stock — sin un producto activo con
 *   stock, los clientes no pueden pedirlo (RF-016). Alta en pop-up; baja con confirmación.
 * ¿Impacto? "Eliminar" desactiva el producto si ya tiene pedidos/ventas asociadas (RN-153).
 *   La paginación es real contra el backend (`?page=&limit=`).
 */

import { useEffect, useState } from 'react';
import { ShoppingCart, Plus } from 'lucide-react';
import * as productsApi from '@/api/products';
import type { Product, ProductsMeta } from '@/types/products';
import { formatCOP } from '@/types/pricing';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/InputField';
import { Alert } from '@/components/ui/Alert';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/hooks/useToast';

interface FormData {
  name: string;
  description: string;
  price: string;
  stock: string;
  category: string;
}

const EMPTY_FORM: FormData = { name: '', description: '', price: '', stock: '', category: '' };
const LOW_STOCK = 5;

// ¿Qué? "Creado por Ana Pérez (5 sept) · última edición: Juan Gómez" — nunca solo un ID.
function formatAuthorLine(product: Product): string | null {
  const created = product.createdBy ? `${product.createdBy.firstName} ${product.createdBy.lastName}` : null;
  const updated = product.updatedBy ? `${product.updatedBy.firstName} ${product.updatedBy.lastName}` : null;
  const createdDate = new Date(product.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });

  if (!created && !updated) return null;

  const parts: string[] = [
    created ? `Creado por ${created} (${createdDate})` : `Creado el ${createdDate} — sin registrar quién`,
  ];
  if (updated && updated !== created) parts.push(`última edición: ${updated}`);
  return parts.join(' · ');
}

export function StaffProductsPage() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<ProductsMeta | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Product | null>(null);

  const loadProducts = (targetPage = page, size = pageSize) => {
    setIsLoading(true);
    return productsApi
      .listProductsForStaff(false, { page: targetPage, limit: size })
      .then((r) => {
        setProducts(r.products);
        setMeta(r.meta);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadProducts(page, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    try {
      await productsApi.createProduct({
        name: formData.name,
        description: formData.description || undefined,
        price: Number(formData.price),
        stock: formData.stock ? Number(formData.stock) : undefined,
        category: formData.category || undefined,
      });
      showToast('Producto creado.', 'success');
      setFormData(EMPTY_FORM);
      setFormOpen(false);
      setPage(1);
      loadProducts(1);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo crear el producto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleActive = async (product: Product) => {
    setBusyId(product.id);
    try {
      await productsApi.updateProduct(product.id, { active: !product.active });
      showToast(product.active ? 'Producto desactivado.' : 'Producto activado.', 'success');
      loadProducts();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo actualizar.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setBusyId(toDelete.id);
    try {
      await productsApi.deleteProduct(toDelete.id);
      showToast('Producto eliminado.', 'success');
      setToDelete(null);
      loadProducts();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo eliminar.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Catálogo de productos"
        description="Productos de la tienda: precio, stock y estado. Solo los activos con stock aparecen para los clientes."
        actions={
          <Button onClick={() => { setFormData(EMPTY_FORM); setFormError(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Nuevo producto
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Productos (total)" value={meta?.total ?? '—'} icon={<ShoppingCart className="h-4 w-4" />} accent="brand" />
        <StatCard label="En esta página" value={products.length} accent="neutral" />
        <StatCard
          label="Con stock bajo (≤ 5) aquí"
          value={products.filter((p) => p.active && p.stock <= LOW_STOCK).length}
          accent="warning"
        />
      </div>

      <DataTable
        head={
          <>
            <th>Producto</th>
            <th>Categoría</th>
            <th>Precio</th>
            <th>Stock</th>
            <th>Estado</th>
            <th className="text-right">Acciones</th>
          </>
        }
        isLoading={isLoading}
        isEmpty={!isLoading && products.length === 0}
        emptyTitle="Todavía no hay productos"
        emptyAction={<Button onClick={() => setFormOpen(true)}>Crear el primero</Button>}
      >
        {products.map((p) => (
          <tr key={p.id} className={p.active ? '' : 'opacity-60'}>
            <td className="text-text">
              <span className="font-medium">{p.name}</span>
              {formatAuthorLine(p) && (
                <span className="mt-0.5 block text-xs text-text-muted">{formatAuthorLine(p)}</span>
              )}
            </td>
            <td className="text-text-muted">{p.category ?? '—'}</td>
            <td className="tabular-nums text-text">{formatCOP(p.price)}</td>
            <td className={p.stock <= LOW_STOCK ? 'font-semibold text-[color:var(--color-warning)]' : 'text-text'}>
              {p.stock}
            </td>
            <td>
              <span className={p.active ? 'text-[color:var(--color-success)]' : 'text-text-muted'}>
                {p.active ? 'Activo' : 'Inactivo'}
              </span>
            </td>
            <td className="text-right">
              <div className="inline-flex gap-2">
                <Button variant="secondary" className="px-3 py-1.5 text-xs" isLoading={busyId === p.id} onClick={() => toggleActive(p)}>
                  {p.active ? 'Desactivar' : 'Activar'}
                </Button>
                <Button variant="danger" className="px-3 py-1.5 text-xs" onClick={() => setToDelete(p)}>
                  Eliminar
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>

      {meta && (
        <Pagination
          page={meta.page}
          pageCount={meta.totalPages}
          total={meta.total}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(s) => {
            setPageSize(s);
            setPage(1);
          }}
          itemNoun="productos"
        />
      )}

      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title="Nuevo producto"
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button form="product-form" type="submit" isLoading={isSubmitting}>
              Crear producto
            </Button>
          </>
        }
      >
        <form id="product-form" onSubmit={handleSubmit} noValidate className="space-y-4">
          {formError && <Alert type="error" message={formError} />}
          <InputField id="name" name="name" label="Nombre del producto" required value={formData.name} onChange={handleChange} maxLength={150} placeholder="Ej: Correa para perro" />
          <InputField id="description" name="description" label="Descripción (opcional)" value={formData.description} onChange={handleChange} maxLength={1000} />
          <InputField id="category" name="category" label="Categoría (opcional)" value={formData.category} onChange={handleChange} maxLength={50} placeholder="Ej: Juguetes, Accesorios" />
          <div className="grid grid-cols-2 gap-4">
            <InputField id="price" name="price" label="Precio (COP)" type="number" min={1} required value={formData.price} onChange={handleChange} />
            <InputField id="stock" name="stock" label="Stock inicial" type="number" min={0} value={formData.stock} onChange={handleChange} placeholder="0" />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title="Eliminar producto"
        message={`¿Eliminar "${toDelete?.name}"? Si ya tiene ventas o pedidos, se desactivará en vez de borrarse.`}
        confirmLabel="Eliminar"
        isLoading={busyId === toDelete?.id}
      />
    </div>
  );
}
