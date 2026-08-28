/**
 * Archivo: pages/staff/StaffSupplierOrdersPage.tsx
 * Descripción: Pedidos de reabastecimiento a proveedores (RF-021, HU-021).
 * ¿Para qué? El stock de un producto solo se incrementa cuando el pedido se marca
 *   como recibido (RN-212) — nunca al crearlo, para no sumar mercancía que aún no llegó.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as suppliersApi from '@/api/suppliers';
import * as productsApi from '@/api/products';
import * as supplierOrdersApi from '@/api/supplier-orders';
import type { Supplier } from '@/types/suppliers';
import type { Product } from '@/types/products';
import type { SupplierOrder } from '@/types/supplier-orders';
import { Button } from '@/components/ui/Button';
import { SelectField } from '@/components/ui/SelectField';
import { InputField } from '@/components/ui/InputField';
import { Alert } from '@/components/ui/Alert';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface DraftItem {
  productId: string;
  quantity: string;
  unitCost: string;
}

const EMPTY_ITEM: DraftItem = { productId: '', quantity: '', unitCost: '' };

export function StaffSupplierOrdersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<SupplierOrder[]>([]);

  const [supplierId, setSupplierId] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [items, setItems] = useState<DraftItem[]>([{ ...EMPTY_ITEM }]);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadOrders = () => supplierOrdersApi.listSupplierOrders().then(setOrders);

  useEffect(() => {
    suppliersApi.listSuppliers().then(setSuppliers);
    productsApi.listProductsForStaff(false).then(setProducts);
    loadOrders();
  }, []);

  const updateItem = (index: number, field: keyof DraftItem, value: string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const addItemRow = () => setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  const removeItemRow = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      await supplierOrdersApi.createSupplierOrder({
        supplierId,
        expectedDate: expectedDate || undefined,
        items: items
          .filter((i) => i.productId && i.quantity && i.unitCost)
          .map((i) => ({ productId: i.productId, quantity: Number(i.quantity), unitCost: Number(i.unitCost) })),
      });
      setSuccess(true);
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
    setError(null);
    try {
      await supplierOrdersApi.receiveSupplierOrder(id);
      await Promise.all([loadOrders(), productsApi.listProductsForStaff(false).then(setProducts)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo marcar el pedido como recibido.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link to="/staff" className="text-sm text-gray-500 dark:text-slate-400 hover:underline">
        ← Volver
      </Link>

      <h1 className="text-2xl font-comic tracking-wide text-gray-900 dark:text-slate-100 mt-4 mb-6">
        🚚 Pedidos a Proveedor
      </h1>

      {success && (
        <div className="mb-4">
          <Alert type="success" message="Pedido creado. El stock se sumará cuando lo marques como recibido." />
        </div>
      )}
      {error && (
        <div className="mb-4">
          <Alert type="error" message={error} />
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4 mb-10">
        <SelectField
          id="supplierId"
          name="supplierId"
          label="Proveedor"
          required
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
        >
          <option value="" disabled>Selecciona un proveedor</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </SelectField>

        <InputField
          id="expectedDate"
          name="expectedDate"
          label="Fecha esperada de entrega (opcional)"
          type="date"
          value={expectedDate}
          onChange={(e) => setExpectedDate(e.target.value)}
        />

        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700 dark:text-slate-300">Productos a pedir</p>
          {items.map((item, index) => (
            <div key={index} className="flex gap-2 items-end">
              <div className="flex-1">
                <SelectField
                  id={`product-${index}`}
                  name={`product-${index}`}
                  label="Producto"
                  value={item.productId}
                  onChange={(e) => updateItem(index, 'productId', e.target.value)}
                >
                  <option value="" disabled>Selecciona</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </SelectField>
              </div>
              <div className="w-24">
                <InputField
                  id={`quantity-${index}`}
                  name={`quantity-${index}`}
                  label="Cantidad"
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                />
              </div>
              <div className="w-32">
                <InputField
                  id={`unitCost-${index}`}
                  name={`unitCost-${index}`}
                  label="Costo unitario"
                  type="number"
                  min={1}
                  value={item.unitCost}
                  onChange={(e) => updateItem(index, 'unitCost', e.target.value)}
                />
              </div>
              {items.length > 1 && (
                <Button type="button" variant="danger" className="text-xs px-2 py-2" onClick={() => removeItemRow(index)}>
                  ✕
                </Button>
              )}
            </div>
          ))}
          <Button type="button" variant="secondary" className="text-xs px-3 py-1.5" onClick={addItemRow}>
            + Agregar producto
          </Button>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" isLoading={isSubmitting}>Crear pedido</Button>
        </div>
      </form>

      <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-3">Pedidos existentes</h2>
      {orders.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-slate-400">Todavía no hay pedidos a proveedor.</p>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id} className="rounded-lg border border-gray-200 dark:border-slate-700 px-4 py-3 text-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-900 dark:text-slate-100">{o.supplierName}</span>
                <StatusBadge status={o.status} />
              </div>
              <ul className="text-gray-500 dark:text-slate-400 mb-2 pl-4 list-disc">
                {o.items.map((item) => (
                  <li key={item.productId}>
                    {item.quantity}x {item.productName} — costo ${item.unitCost.toLocaleString('es-CO')} c/u
                  </li>
                ))}
              </ul>
              {o.status === 'ordered' && (
                <Button
                  variant="primary"
                  className="text-xs px-3 py-1.5"
                  isLoading={busyId === o.id}
                  onClick={() => handleReceive(o.id)}
                >
                  Marcar como recibido
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
