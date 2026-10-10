/**
 * Archivo: types/products.ts
 * Descripción: Tipos TypeScript para el catálogo de productos (RF-015).
 */

// ¿Qué? Autor de la creación/edición de un producto — solo lo mínimo para mostrarlo
//   ("Creado por Ana Pérez"), nunca datos sensibles del usuario.
export interface ProductAuthor {
  id: string;
  firstName: string;
  lastName: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  category: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  // ¿Qué? null en productos creados antes de que existiera esta trazabilidad.
  createdBy: ProductAuthor | null;
  updatedBy: ProductAuthor | null;
}

// ¿Qué? Metadatos de paginación que acompañan la lista de productos.
export interface ProductsMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListProductsParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  lowStock?: 'true';
}

export interface PaginatedProducts {
  products: Product[];
  meta: ProductsMeta;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  stock?: number;
  category?: string;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  category?: string;
  active?: boolean;
}
