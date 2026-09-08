/**
 * Archivo: hooks/usePagination.ts
 * Descripción: Paginación EN CLIENTE para listados que ya vienen completos del backend.
 * ¿Para qué? La mayoría de endpoints (citas, mascotas, servicios, ventas, proveedores…)
 *   devuelven el array entero. Este hook lo corta en páginas sin pedir cambios al backend.
 *   Los módulos que sí paginan en servidor (productos, tienda) NO usan este hook: alimentan
 *   <Pagination> con el `meta` de la respuesta.
 * ¿Impacto? Reinicia a la página 1 cuando cambia el tamaño de página o el largo de la
 *   lista (p. ej. al aplicar un filtro), para no quedar en una página que ya no existe.
 */

import { useMemo, useState } from 'react';

interface UsePaginationResult<T> {
  pageItems: T[];
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  pageCount: number;
  total: number;
}

export function usePagination<T>(items: T[], initialPageSize = 10): UsePaginationResult<T> {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  // ¿Qué? Página efectiva — se corrige EN RENDER si quedó fuera de rango (p. ej. un filtro
  //   achicó la lista). Sin efecto ni setState: el valor derivado basta.
  const safePage = Math.min(Math.max(1, page), pageCount);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  return {
    pageItems,
    page: safePage,
    setPage,
    pageSize,
    setPageSize: (size: number) => {
      setPageSize(size);
      setPage(1);
    },
    pageCount,
    total,
  };
}
