/**
 * Archivo: pages/client/ShopPage.tsx
 * Descripción: Tienda de productos — vitrina, carrito y confirmación de pedido (RF-016, HU-016).
 * ¿Para qué? No hay pago en línea — el cliente arma el carrito, confirma el pedido y
 *   paga presencialmente en el local al recogerlo (auto-servicio de apartado).
 * ¿Impacto? El precio y el stock disponible se validan siempre en el servidor al
 *   confirmar — el total que se muestra aquí es solo referencial.
 *
 * ¿Qué cambió respecto a la versión anterior (lista plana)?
 * - Vitrina en tarjetas con categoría, descripción y aviso de stock — antes solo se
 *   mostraban nombre y precio en una lista de texto.
 * - Paginación real contra el backend (`?page=&limit=`) en vez de traer TODO el catálogo
 *   de una sola vez.
 * - Filtro por categoría y buscador por nombre, usando los mismos query params que ya
 *   soporta el endpoint de productos.
 * - El carrito ya no depende de que el producto siga cargado en la página actual: se
 *   guarda un mapa `productsById` que se va acumulando en cada fetch, así cambiar de
 *   página no hace que el total del carrito "olvide" productos de otra página.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as productsApi from '@/api/products';
import * as ordersApi from '@/api/orders';
import type { Product, ProductsMeta } from '@/types/products';
import type { Order } from '@/types/orders';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { StatusBadge } from '@/components/ui/StatusBadge';

const PAGE_SIZE = 8;
const LOW_STOCK_THRESHOLD = 5;

function StockBadge({ stock }: { stock: number }) {
  if (stock <= 0) {
    return (
      <span className="inline-block rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 text-xs font-medium px-2 py-0.5">
        Agotado
      </span>
    );
  }
  if (stock <= LOW_STOCK_THRESHOLD) {
    return (
      <span className="inline-block rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 text-xs font-medium px-2 py-0.5">
        ¡Solo quedan {stock}!
      </span>
    );
  }
  return (
    <span className="inline-block rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-xs font-medium px-2 py-0.5">
      En stock
    </span>
  );
}

export function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsById, setProductsById] = useState<Record<string, Product>>({});
  const [meta, setMeta] = useState<ProductsMeta | null>(null);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [cart, setCart] = useState<Record<string, number>>({});
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  const rememberProducts = (list: Product[]) => {
    setProductsById((prev) => {
      const next = { ...prev };
      for (const p of list) next[p.id] = p;
      return next;
    });
  };

  const loadOrders = () => ordersApi.listMyOrders().then(setOrders);

  // ¿Qué? Muestra de hasta 100 productos SOLO para armar la lista de categorías del
  //   filtro — no existe un endpoint "/products/categories" dedicado, y traer un lote
  //   grande una sola vez para esto es más simple que agregar un endpoint nuevo solo
  //   para esta lista. La grilla que el cliente ve sigue paginada de a 8.
  useEffect(() => {
    productsApi.listProducts({ limit: 100 }).then((r) => {
      rememberProducts(r.products);
      const found = Array.from(new Set(r.products.map((p) => p.category).filter((c): c is string => !!c)));
      setCategories(found.sort((a, b) => a.localeCompare(b, 'es')));
    });
    loadOrders();
  }, []);

  useEffect(() => {
    setIsLoadingProducts(true);
    productsApi
      .listProducts({ page, limit: PAGE_SIZE, category: category ?? undefined, search: search || undefined })
      .then((r) => {
        setProducts(r.products);
        setMeta(r.meta);
        rememberProducts(r.products);
      })
      .finally(() => setIsLoadingProducts(false));
  }, [page, category, search]);

  const setQuantity = (productId: string, quantity: number, maxStock: number) => {
    const clamped = Math.max(0, Math.min(quantity, maxStock));
    setCart((prev) => {
      const next = { ...prev };
      if (clamped <= 0) delete next[productId];
      else next[productId] = clamped;
      return next;
    });
  };

  const cartItems = Object.entries(cart)
    .map(([productId, quantity]) => {
      const product = productsById[productId];
      return product ? { product, quantity } : null;
    })
    .filter((item): item is { product: Product; quantity: number } => item !== null);

  const total = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      await ordersApi.createOrder({
        items: cartItems.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
      });
      setSuccess(true);
      setCart({});
      const r = await productsApi.listProducts({
        page,
        limit: PAGE_SIZE,
        category: category ?? undefined,
        search: search || undefined,
      });
      setProducts(r.products);
      setMeta(r.meta);
      rememberProducts(r.products);
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo confirmar el pedido.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <Link to="/app" className="text-sm text-text-muted hover:underline">
        ← Volver
      </Link>

      {/* ─── Hero comercial ─── */}
      <div className="mt-4 mb-8 rounded-2xl card bg-gradient-to-br from-brand-600 to-brand-800 px-6 py-8 text-white">
        <h1 className="text-3xl font-display tracking-wide mb-1">🛍️ Tienda Super Amigos</h1>
        <p className="text-brand-100 max-w-xl">
          Todo lo que tu mascota necesita, listo para recoger — arma tu pedido aquí y págalo
          presencialmente en el local.
        </p>
      </div>

      {success && (
        <div className="mb-4">
          <Alert type="success" message="¡Pedido confirmado! Te esperamos para que lo recojas y pagues en el local." />
        </div>
      )}
      {error && (
        <div className="mb-4">
          <Alert type="error" message={error} />
        </div>
      )}

      {/* ─── Filtros: búsqueda + categorías ─── */}
      <div className="mb-5 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-md">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar producto..."
            maxLength={100}
            className="flex-1 px-3 py-2 text-sm rounded-lg bg-surface text-text border border-border focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <Button type="submit" variant="secondary" className="text-sm px-4">Buscar</Button>
        </form>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setCategory(null); setPage(1); }}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors duration-200 ${
                category === null
                  ? 'bg-brand-600 border-brand-600 text-white'
                  : 'border-border text-text hover:bg-surface-2'
              }`}
            >
              Todas
            </button>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => { setCategory(c); setPage(1); }}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors duration-200 ${
                  category === c
                    ? 'bg-brand-600 border-brand-600 text-white'
                    : 'border-border text-text hover:bg-surface-2'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─── Vitrina ─── */}
      {isLoadingProducts ? (
        <p className="text-sm text-text-muted mb-10">Cargando productos...</p>
      ) : products.length === 0 ? (
        <p className="text-sm text-text-muted mb-10">
          No encontramos productos{category ? ` en "${category}"` : ''}{search ? ` para "${search}"` : ''}.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {products.map((p) => (
              <div
                key={p.id}
                className={`flex flex-col rounded-xl card bg-surface p-4 ${
                  p.stock <= 0 ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  {p.category && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-primary)]">
                      {p.category}
                    </span>
                  )}
                  <StockBadge stock={p.stock} />
                </div>
                <p className="font-semibold text-text leading-snug">{p.name}</p>
                {p.description && (
                  <p className="mt-1 text-xs text-text-muted line-clamp-2 flex-1">
                    {p.description}
                  </p>
                )}
                <p className="mt-2 text-xl font-bold text-text">
                  ${p.price.toLocaleString('es-CO')}
                </p>

                <div className="mt-3 flex items-center justify-center gap-2">
                  <Button
                    variant="secondary"
                    className="text-xs px-2 py-1"
                    disabled={!cart[p.id]}
                    onClick={() => setQuantity(p.id, (cart[p.id] ?? 0) - 1, p.stock)}
                  >
                    −
                  </Button>
                  <span className="w-6 text-center text-sm">{cart[p.id] ?? 0}</span>
                  <Button
                    variant="secondary"
                    className="text-xs px-2 py-1"
                    disabled={(cart[p.id] ?? 0) >= p.stock}
                    onClick={() => setQuantity(p.id, (cart[p.id] ?? 0) + 1, p.stock)}
                  >
                    +
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between mb-10 text-sm">
              <Button
                variant="secondary"
                className="text-xs px-3 py-1.5"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Anterior
              </Button>
              <span className="text-text-muted">
                Página {meta.page} de {meta.totalPages}
              </span>
              <Button
                variant="secondary"
                className="text-xs px-3 py-1.5"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente →
              </Button>
            </div>
          )}
        </>
      )}

      {cartItems.length > 0 && (
        <div className="mb-10 rounded-xl card bg-surface px-5 py-4">
          <p className="text-sm font-medium text-text-muted mb-1">
            {cartItems.reduce((n, i) => n + i.quantity, 0)} producto(s) en el carrito
          </p>
          <p className="text-2xl font-bold text-text mb-3">
            Total: ${total.toLocaleString('es-CO')}
          </p>
          <Button isLoading={isSubmitting} onClick={handleCheckout}>Confirmar pedido</Button>
        </div>
      )}

      <h2 className="text-lg font-semibold text-text mb-3">Mis pedidos</h2>
      {orders.length === 0 ? (
        <p className="text-sm text-text-muted">Todavía no tienes pedidos.</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {orders.map((o) => (
            <li key={o.id} className="rounded-lg border border-border px-4 py-3 text-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-text">
                  ${o.total.toLocaleString('es-CO')}
                </span>
                <StatusBadge status={o.status} />
              </div>
              <ul className="text-text-muted pl-4 list-disc">
                {o.items.map((item) => (
                  <li key={item.productId}>{item.quantity}x {item.name}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
