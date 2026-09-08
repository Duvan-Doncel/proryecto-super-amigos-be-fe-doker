/**
 * Archivo: pages/staff/StaffOrdersPage.tsx
 * Descripción: Bandeja de pedidos pendientes de productos (RF-019, HU-019).
 * ¿Para qué? El cliente arma su pedido en la tienda (RF-016) y paga al recoger — aquí el
 *   staff confirma la entrega/pago o cancela si no lo recogen.
 * ¿Impacto? Cancelar restaura el stock reservado (RN-192); completar marca el pago
 *   automáticamente (RN-191). La cancelación pide confirmación.
 */

import { useEffect, useMemo, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import * as ordersApi from '@/api/orders';
import type { StaffOrder } from '@/types/orders';
import { formatCOP } from '@/types/pricing';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { usePagination } from '@/hooks/usePagination';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/hooks/useToast';

export function StaffOrdersPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<StaffOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toCancel, setToCancel] = useState<StaffOrder | null>(null);

  const loadOrders = () => {
    ordersApi
      .listPendingOrders()
      .then(setOrders)
      .catch((err) => showToast(err instanceof Error ? err.message : 'No se pudieron cargar los pedidos.', 'error'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const porCobrar = useMemo(() => orders.reduce((s, o) => s + o.total, 0), [orders]);
  const { pageItems, page, setPage, pageSize, setPageSize, pageCount, total } = usePagination(orders, 8);

  const changeStatus = async (id: string, status: 'completed' | 'cancelled') => {
    setBusyId(id);
    try {
      await ordersApi.updateOrderStatus(id, status);
      showToast(status === 'completed' ? 'Pedido entregado y cobrado.' : 'Pedido cancelado.', 'success');
      setToCancel(null);
      loadOrders();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo actualizar el pedido.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Pedidos pendientes"
        description="Pedidos de la tienda listos para entregar y cobrar en el local."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard label="Pedidos por entregar" value={total} icon={<ClipboardList className="h-4 w-4" />} accent={total > 0 ? 'warning' : 'success'} />
        <StatCard label="Total por cobrar" value={formatCOP(porCobrar)} accent="brand" />
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full" lines={2} />
      ) : orders.length === 0 ? (
        <EmptyState icon={<ClipboardList className="h-6 w-6" />} title="No hay pedidos pendientes" description="Los pedidos que confirmen los clientes aparecerán aquí." />
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {pageItems.map((o) => (
              <Card key={o.id} padded={false}>
                <div className="p-4 text-sm">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-medium text-text">
                      {o.client.firstName} {o.client.lastName}
                      {o.client.phone ? <span className="text-text-muted"> · {o.client.phone}</span> : null}
                    </span>
                    <StatusBadge status={o.status} />
                  </div>
                  <ul className="mb-2 list-disc pl-4 text-text-muted">
                    {o.items.map((item) => (
                      <li key={item.productId}>
                        {item.quantity}× {item.name} — {formatCOP(item.unitPrice * item.quantity)}
                      </li>
                    ))}
                  </ul>
                  <p className="mb-3 font-semibold text-text">Total: {formatCOP(o.total)}</p>
                  <div className="flex gap-2">
                    <Button
                      className="px-3 py-1.5 text-xs"
                      isLoading={busyId === o.id}
                      onClick={() => changeStatus(o.id, 'completed')}
                    >
                      Marcar pagado y entregado
                    </Button>
                    <Button variant="danger" className="px-3 py-1.5 text-xs" onClick={() => setToCancel(o)}>
                      Cancelar
                    </Button>
                  </div>
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

      <ConfirmDialog
        isOpen={toCancel !== null}
        onClose={() => setToCancel(null)}
        onConfirm={() => toCancel && changeStatus(toCancel.id, 'cancelled')}
        title="Cancelar pedido"
        message={`¿Cancelar el pedido de ${toCancel?.client.firstName} ${toCancel?.client.lastName}? Se restaurará el stock reservado.`}
        confirmLabel="Cancelar pedido"
        cancelLabel="Volver"
        isLoading={busyId === toCancel?.id}
      />
    </div>
  );
}
