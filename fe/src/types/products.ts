/**
 * Archivo: types/products.ts
 * Descripción: Tipos TypeScript para el catálogo de productos (RF-015).
 */

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  category: string | null;
  active: boolean;
  createdAt: string;
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
