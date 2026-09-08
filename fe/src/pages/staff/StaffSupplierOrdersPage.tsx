/**
 * Archivo: pages/staff/StaffSupplierOrdersPage.tsx
 * Descripción: Pedidos de reabastecimiento a proveedores (RF-021, HU-021).
 * ¿Para qué? El stock de un producto solo sube cuando el pedido se marca como recibido
 *   (RN-212) — nunca al crearlo, para no sumar mercancía que aún no llegó.
 */

import { useEffect, useMemo, useState } from 'react';
import { Truck, Plus } from 'lucide-react';
import * as suppliersApi from '@/api/suppliers';
import * as productsApi from '@/api/products';
import * as supplierOrdersApi from '@/api/supplier-orders';
import type { Supplier } from '@/types/suppliers';
import type { Product } from '@/types/products';
import type { SupplierOrder } from '@/types/supplier-orders';
import { formatCOP } from '@/types/pricing';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { usePagination } from '@/hooks/usePagination';
import { Button } from '@/components/ui/Button';
import { SelectField } from '@/components/ui/SelectField';
import { InputField } from '@/components/ui/InputField';
import { Alert } from '@/components/ui/Alert';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useToast } from '@/hooks/useToast';

interface DraftItem {
  productId: string;
  quantity: string;
  unitCost: string;
}

const EMPTY_ITEM: DraftItem = { productId: '', quantity: '', unitCost: '' };

export function StaffSupplierOrdersPage() {
  const { showToast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<SupplierOrder[]>([]);

  const [supplierId, setSupplierId] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [items, setItems] = useState<DraftItem[]>([{ ...EMPTY_ITEM }]);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadOrders = () => supplierOrdersApi.listSupplierOrders().then(setOrders);
  const loadProducts = () =>
    productsApi.listProductsForStaff(false, { limit: 100 }).then((r) => setProducts(r.products));

  useEffect(() => {
    suppliersApi.listSuppliers().then(setSuppliers);
    loadProducts();
    loadOrders();
  }, []);

  const open = useMemo(() => orders.filter((o) => o.status === 'ordered').length, [orders]);
  const { pageItems, page, setPage, pageSize, setPageSize, pageCount, total } = usePagination(orders, 8);

  const updateItem = (index: number, field: keyof DraftItem, value: string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };
  const addItemRow = () => setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  const removeItemRow = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await supplierOrdersApi.createSupplierOrder({
        supplierId,
        expectedDate: expectedDate || undefined,
        items: items
          .filter((i) => i.productId && i.quantity && i.unitCost)
          .map((i) => ({ productId: i.productId, quantity: Number(i.quantity), unitCost: Number(i.unitCost) })),
      });
      showToast('Pedido creado. El stock se sumará al recibirlo.', 'success');
      setSupplierId('');
      setExpectedDate('');
      setItems([{ ...EMPTY_ITEM }]);
      loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el pedido.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReceive = async (id: string) => {
    setBusyId(id);
    try {
      await supplierOrdersApi.receiveSupplierOrder(id);
      showToast('Pedido recibido. Stock actualizado.', 'success');
      await Promise.all([loadOrders(), loadProducts()]);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo marcar como recibido.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Pedidos a proveedor"
        description="Reabastecimiento de inventario. El stock sube solo cuando marcas el pedido como recibido."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Pedidos (total)" value={total} icon={<Truck className="h-4 w-4" />} accent="brand" />
        <StatCard label="Abiertos" value={open} accent={open > 0 ? 'warning' : 'success'} />
        <StatCard label="Recibidos" value={total - open} accent="neutral" />
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader title="Nuevo pedido" />
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {error && <Alert type="error" message={error} />}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SelectField id="supplierId" name="supplierId" label="Proveedor" required value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                <option value="" disabled>Selecciona un proveedor</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </SelectField>
              <InputField id="expectedDate" name="expectedDate" label="Fecha esperada (opcional)" type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-text">Productos a pedir</p>
              {items.map((item, index) => (
                <div key={index} className="flex flex-wrap items-end gap-2">
                  <div className="min-w-[10rem] flex-1">
                    <SelectField id={`product-${index}`} name={`product-${index}`} label="Producto" value={item.productId} onChange={(e) => updateItem(index, 'productId', e.target.value)}>
                      <option value="" disabled>Selecciona</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </SelectField>
                  </div>
                  <div className="w-20">
                    <InputField id={`quantity-${index}`} name={`quantity-${index}`} label="Cant." type="number" min={1} value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)} />
                  </div>
                  <div className="w-28">
                    <InputField id={`unitCost-${index}`} name={`unitCost-${index}`} label="Costo unit." type="number" min={1} value={item.unitCost} onChange={(e) => updateItem(index, 'unitCost', e.target.value)} />
                  </div>
                  {items.length > 1 && (
                    <Button type="button" variant="danger" className="px-2 py-2 text-xs" onClick={() => removeItemRow(index)} aria-label="Quitar producto">
                      ✕
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="secondary" className="px-3 py-1.5 text-xs" onClick={addItemRow}>
                <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Agregar producto
              </Button>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" isLoading={isSubmitting}>Crear pedido</Button>
            </div>
          </form>
        </Card>

        <div>
          <h2 className="mb-3 font-display text-lg font-bold text-text">Pedidos registrados</h2>
          {orders.length === 0 ? (
            <EmptyState icon={<Truck className="h-6 w-6" />} title="Aún no hay pedidos a proveedor" />
          ) : (
            <>
              <ul className="space-y-3">
                {pageItems.map((o) => (
                  <Card key={o.id} padded={false}>
                    <div className="p-4 text-sm">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-medium text-text">{o.supplierName}</span>
                        <StatusBadge status={o.status} />
                      </div>
                      <ul className="mb-2 list-disc pl-4 text-text-muted">
                        {o.items.map((item) => (
                          <li key={item.productId}>
                            {item.quantity}× {item.productName} — {formatCOP(item.unitCost)} c/u
                          </li>
                        ))}
                      </ul>
                      {o.status === 'ordered' && (
                        <Button className="px-3 py-1.5 text-xs" isLoading={busyId === o.id} onClick={() => handleReceive(o.id)}>
                          Marcar como recibido
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </ul>
              <Pagination
                page={page}
                pageCount={pageCount}
                total={total}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                itemNoun="pedidos"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
