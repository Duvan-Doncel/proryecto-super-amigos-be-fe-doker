/**
 * Archivo: api/products.ts
 * Descripción: Llamadas HTTP para el catálogo de productos (RF-015).
 */

import { apiClient } from './axios';
import type { ApiResponse } from '@/types/auth';
import type {
  CreateProductRequest,
  ListProductsParams,
  PaginatedProducts,
  Product,
  UpdateProductRequest,
} from '@/types/products';

type ProductsApiResponse = ApiResponse<Product[]> & { meta: PaginatedProducts['meta'] };

// ¿Qué? Catálogo público, paginado — siempre solo productos activos (RN-154).
// ¿Para qué? `params` deja filtrar por categoría/búsqueda sin traer el catálogo completo —
//   la tienda del cliente y el panel de staff comparten esta misma función.
export async function listProducts(params: ListProductsParams = {}): Promise<PaginatedProducts> {
  const res = await apiClient.get<ProductsApiResponse>('/products', { params });
  return { products: res.data.data, meta: res.data.meta };
}

// ¿Qué? Catálogo completo para el staff, incluye inactivos.
export async function listProductsForStaff(
  activeOnly = true,
  params: ListProductsParams = {},
): Promise<PaginatedProducts> {
  const res = await apiClient.get<ProductsApiResponse>('/products/staff', {
    params: { ...params, active: activeOnly },
  });
  return { products: res.data.data, meta: res.data.meta };
}

export async function createProduct(data: CreateProductRequest): Promise<Product> {
  const res = await apiClient.post<ApiResponse<Product>>('/products', data);
  return res.data.data;
}

export async function updateProduct(id: string, data: UpdateProductRequest): Promise<Product> {
  const res = await apiClient.put<ApiResponse<Product>>(`/products/${id}`, data);
  return res.data.data;
}

export async function deleteProduct(id: string): Promise<void> {
  await apiClient.delete(`/products/${id}`);
}
