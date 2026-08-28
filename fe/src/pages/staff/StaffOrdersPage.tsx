/**
 * Archivo: pages/staff/StaffOrdersPage.tsx
 * Descripción: Bandeja de pedidos pendientes de productos (RF-019, HU-019).
 * ¿Para qué? El cliente arma su pedido en la tienda (RF-016) y paga presencialmente al
 *   recoger — aquí el staff confirma la entrega/pago o cancela si no lo recogen.
 * ¿Impacto? Cancelar restaura el stock reservado (RN-192); completar marca el pago
 *   automáticamente (RN-191) — el staff no elige el paymentStatus por separado.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as ordersApi from '@/api/orders';
import type { StaffOrder } from '@/types/orders';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { StatusBadge } from '@/components/ui/StatusBadge';

export function StaffOrdersPage() {
  const [orders, setOrders] = useState<StaffOrder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadOrders = () => {
    setIsLoading(true);
    ordersApi
      .listPendingOrders()
      .then(setOrders)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudieron cargar los pedidos.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleStatusChange = async (id: string, status: 'completed' | 'cancelled') => {
    setBusyId(id);
    setError(null);
    try {
      await ordersApi.updateOrderStatus(id, status);
      loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el pedido.');
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
        📋 Pedidos Pendientes
      </h1>

      {error && (
        <div className="mb-4">
          <Alert type="error" message={error} />
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-500 dark:text-slate-400">Cargando...</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-slate-400">No hay pedidos pendientes por entregar.</p>
      ) : (
        <ul className="space-y-4">
          {orders.map((o) => (
            <li key={o.id} className="rounded-lg border border-gray-200 dark:border-slate-700 px-4 py-3 text-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-900 dark:text-slate-100">
                  {o.client.firstName} {o.client.lastName}
                  {o.client.phone ? ` — ${o.client.phone}` : ''}
                </span>
                <StatusBadge status={o.status} />
              </div>

              <ul className="text-gray-600 dark:text-slate-400 mb-2 pl-4 list-disc">
                {o.items.map((item) => (
                  <li key={item.productId}>
                    {item.quantity}x {item.name} — ${(item.unitPrice * item.quantity).toLocaleString('es-CO')}
                  </li>
                ))}
              </ul>

              <p className="font-medium text-gray-900 dark:text-slate-100 mb-2">
                Total: ${o.total.toLocaleString('es-CO')}
              </p>

              <div className="flex gap-2">
                <Button
                  variant="primary"
                  className="text-xs px-3 py-1.5"
                  isLoading={busyId === o.id}
                  onClick={() => handleStatusChange(o.id, 'completed')}
                >
                  Marcar pagado y entregado
                </Button>
                <Button
                  variant="danger"
                  className="text-xs px-3 py-1.5"
                  isLoading={busyId === o.id}
                  onClick={() => handleStatusChange(o.id, 'cancelled')}
                >
                  Cancelar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
