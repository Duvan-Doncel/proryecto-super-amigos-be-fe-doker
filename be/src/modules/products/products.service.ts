/**
 * Archivo: modules/products/products.service.ts
 * Descripción: Lógica de negocio del catálogo de productos (RF-015).
 * ¿Para qué? El `stock` de esta tabla es la fuente de verdad de existencias — la
 *   modifican los pedidos (RF-016), las ventas de mostrador (RF-023) y la recepción
 *   de pedidos a proveedor (RF-021).
 */

import type { Product } from '@prisma/client';
import { db } from '../../db/index.js';
import { NotFoundError } from '../../middlewares/error.middleware.js';
import type { CreateProductInput, UpdateProductInput } from './products.schema.js';

export interface ProductResponse {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  category: string | null;
  active: boolean;
  createdAt: Date;
}

function toProductResponse(product: Product): ProductResponse {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: Number(product.price),
    stock: product.stock,
    category: product.category,
    active: product.active,
    createdAt: product.createdAt,
  };
}

// ¿Qué? Lista productos — por defecto solo los activos (RN-154).
export async function listProducts(activeOnly = true): Promise<ProductResponse[]> {
  const products = await db.product.findMany({
    where: activeOnly ? { active: true } : undefined,
    orderBy: { name: 'asc' },
  });
  return products.map(toProductResponse);
}

export async function createProduct(data: CreateProductInput): Promise<ProductResponse> {
  const product = await db.product.create({ data });
  return toProductResponse(product);
}

export async function updateProduct(
  id: string,
  data: UpdateProductInput,
): Promise<ProductResponse> {
  const existing = await db.product.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Producto no encontrado.');

  const updated = await db.product.update({ where: { id }, data });
  return toProductResponse(updated);
}

// ¿Qué? "Elimina" un producto — si tiene pedidos o ventas asociadas, lo desactiva
//   en vez de borrarlo (RN-153), para no perder el historial que lo referencia.
export async function deleteProduct(id: string): Promise<{ softDeleted: boolean }> {
  const existing = await db.product.findUnique({
    where: { id },
    include: { _count: { select: { orderItems: true, saleItems: true, supplierOrderItems: true } } },
  });
  if (!existing) throw new NotFoundError('Producto no encontrado.');

  const hasHistory =
    existing._count.orderItems > 0 ||
    existing._count.saleItems > 0 ||
    existing._count.supplierOrderItems > 0;

  if (hasHistory) {
    await db.product.update({ where: { id }, data: { active: false } });
    return { softDeleted: true };
  }

  await db.product.delete({ where: { id } });
  return { softDeleted: false };
}
