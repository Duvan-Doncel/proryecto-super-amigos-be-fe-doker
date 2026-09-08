/**
 * Archivo: pages/staff/StaffSalesPage.tsx
 * Descripción: Registro de venta de mostrador (RF-023, HU-023).
 * ¿Para qué? No toda venta pasa por el carrito de la app — un cliente puede comprar
 *   directamente en el local. A diferencia de un pedido, nace ya pagada y completada.
 * ¿Impacto? El comprador es opcional: puede ser un cliente con cuenta (buscado por
 *   nombre/email) o un comprador ocasional identificado solo por su nombre.
 */

import { useEffect, useState } from 'react';
import * as productsApi from '@/api/products';
import * as staffApi from '@/api/staff';
import * as salesApi from '@/api/sales';
import type { Product } from '@/types/products';
import type { ClientSummary } from '@/types/staff';
import { formatCOP } from '@/types/pricing';
import { PageHeader } from '@/components/ui/PageHeader';
import { Pagination } from '@/components/ui/Pagination';
import { usePagination } from '@/hooks/usePagination';
import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/InputField';
import { Alert } from '@/components/ui/Alert';
import { useToast } from '@/hooks/useToast';

export function StaffSalesPage() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ClientSummary[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientSummary | null>(null);
  const [clientName, setClientName] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const productsPage = usePagination(products, 10);

  useEffect(() => {
    productsApi.listProducts({ limit: 100 }).then((r) => setProducts(r.products));
  }, []);

  const setQuantity = (productId: string, quantity: number) => {
    setCart((prev) => {
      const next = { ...prev };
      if (quantity <= 0) delete next[productId];
      else next[productId] = quantity;
      return next;
    });
  };

  const cartItems = Object.entries(cart)
    .map(([productId, quantity]) => {
      const product = products.find((p) => p.id === productId);
      return product ? { product, quantity } : null;
    })
    .filter((item): item is { product: Product; quantity: number } => item !== null);

  const total = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length < 2) return;
    setIsSearching(true);
    try {
      setResults(await staffApi.searchClients(query.trim()));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo buscar el cliente.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async () => {
    if (cartItems.length === 0) {
      setError('Agrega al menos un producto.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await salesApi.createSale({
        items: cartItems.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
        clientId: selectedClient?.id,
        clientName: !selectedClient && clientName.trim() ? clientName.trim() : undefined,
      });
      showToast('Venta registrada.', 'success');
      setCart({});
      setSelectedClient(null);
      setClientName('');
      setResults([]);
      setQuery('');
      productsApi.listProducts({ limit: 100 }).then((r) => setProducts(r.products));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar la venta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Registrar venta de mostrador"
        description="Ventas que no pasan por el carrito de la app. Nacen ya pagadas y completadas."
      />

      {error && (
        <div className="mb-4">
          <Alert type="error" message={error} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div>
          <h2 className="text-lg font-semibold text-text mb-3">Comprador (opcional)</h2>
          {selectedClient ? (
            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm">
              <span>
                <strong className="text-text">{selectedClient.firstName} {selectedClient.lastName}</strong> — {selectedClient.email}
              </span>
              <button onClick={() => setSelectedClient(null)} className="text-[color:var(--color-primary)] hover:underline">
                Quitar
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="flex-1">
                  <InputField
                    id="query"
                    name="query"
                    label="Buscar cliente con cuenta (opcional)"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Nombre, email o documento"
                    maxLength={100}
                  />
                </div>
                <div className="pt-7">
                  <Button type="submit" isLoading={isSearching}>Buscar</Button>
                </div>
              </form>
              {results.length > 0 && (
                <ul className="space-y-2">
                  {results.map((c) => (
                    <li key={c.id}>
                      <button
                        onClick={() => { setSelectedClient(c); setResults([]); }}
                        className="w-full text-left rounded-lg border border-border px-4 py-3 text-sm hover:border-brand-400 dark:hover:border-brand-500"
                      >
                        {c.firstName} {c.lastName} — {c.email}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <InputField
                id="clientName"
                name="clientName"
                label="O nombre del comprador ocasional (sin cuenta)"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ej: Cliente de mostrador"
                maxLength={150}
              />
            </div>
          )}

          {cartItems.length > 0 && (
            <div className="mt-6 rounded-lg border border-border px-4 py-3">
              <p className="font-medium text-text mb-2">Total: {formatCOP(total)}</p>
              <Button isLoading={isSubmitting} onClick={handleSubmit}>Registrar venta</Button>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold text-text mb-3">Productos</h2>
          {products.length === 0 ? (
            <p className="text-sm text-text-muted">No hay productos disponibles.</p>
          ) : (
            <>
            <ul className="space-y-2">
              {productsPage.pageItems.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-text">{p.name}</p>
                    <p className="text-text-muted">
                      {formatCOP(p.price)} — {p.stock} disponibles
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      className="text-xs px-2 py-1"
                      disabled={!cart[p.id]}
                      onClick={() => setQuantity(p.id, (cart[p.id] ?? 0) - 1)}
                    >
                      −
                    </Button>
                    <span className="w-6 text-center">{cart[p.id] ?? 0}</span>
                    <Button
                      variant="secondary"
                      className="text-xs px-2 py-1"
                      disabled={(cart[p.id] ?? 0) >= p.stock}
                      onClick={() => setQuantity(p.id, (cart[p.id] ?? 0) + 1)}
                    >
                      +
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
            <Pagination
              page={productsPage.page}
              pageCount={productsPage.pageCount}
              total={productsPage.total}
              pageSize={productsPage.pageSize}
              onPageChange={productsPage.setPage}
              onPageSizeChange={productsPage.setPageSize}
              itemNoun="productos"
            />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
