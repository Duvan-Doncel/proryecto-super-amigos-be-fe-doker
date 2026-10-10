/**
 * Archivo: modules/products/products.service.ts
 * Descripción: Lógica de negocio del catálogo de productos (RF-015).
 * ¿Para qué? El `stock` de esta tabla es la fuente de verdad de existencias — la
 *   modifican los pedidos (RF-016), las ventas de mostrador (RF-023) y la recepción
 *   de pedidos a proveedor (RF-021).
 */

import type { Prisma, Product, User } from '@prisma/client';
import { db } from '../../db/index.js';
import { NotFoundError } from '../../middlewares/error.middleware.js';
import type { CreateProductInput, UpdateProductInput, ListProductsQuery } from './products.schema.js';

// ¿Qué? Solo lo necesario para mostrar "Creado por Ana Pérez" — nunca el hash de contraseña.
type AuthorInfo = Pick<User, 'id' | 'firstName' | 'lastName'>;
const AUTHOR_SELECT = { id: true, firstName: true, lastName: true } as const;

type ProductWithAuthors = Product & {
  createdBy: AuthorInfo | null;
  updatedBy: AuthorInfo | null;
};

// ¿Qué? Umbral de "stock bajo" — mismo valor que usa la pantalla de staff para resaltarlo.
const LOW_STOCK_THRESHOLD = 5;

export interface ProductResponse {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  category: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: AuthorInfo | null;
  updatedBy: AuthorInfo | null;
}

export interface PaginatedProducts {
  data: ProductResponse[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function toProductResponse(product: ProductWithAuthors): ProductResponse {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: Number(product.price),
    stock: product.stock,
    category: product.category,
    active: product.active,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    createdBy: product.createdBy,
    updatedBy: product.updatedBy,
  };
}

// ¿Qué? Lista productos paginada — por defecto solo los activos (RN-154).
// ¿Para qué? Con más de una página de productos, traerlos todos de una sola vez se vuelve
//   lento y hace crecer la página del cliente/staff sin límite. `page`/`limit` acotan la
//   respuesta; `category` y `search` reutilizan las mismas columnas que ya existían en la
//   tabla (RF-015) para que el cliente pueda filtrar sin traer todo el catálogo.
export async function listProducts(
  activeOnly = true,
  query: Partial<ListProductsQuery> = {},
): Promise<PaginatedProducts> {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;

  const where: Prisma.ProductWhereInput = {
    ...(activeOnly ? { active: true } : {}),
    ...(query.category ? { category: { contains: query.category, mode: 'insensitive' } } : {}),
    ...(query.search ? { name: { contains: query.search, mode: 'insensitive' } } : {}),
    ...(query.lowStock === 'true' ? { stock: { lte: LOW_STOCK_THRESHOLD } } : {}),
  };

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { createdBy: { select: AUTHOR_SELECT }, updatedBy: { select: AUTHOR_SELECT } },
    }),
    db.product.count({ where }),
  ]);

  return {
    data: products.map(toProductResponse),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function createProduct(
  createdById: string,
  data: CreateProductInput,
): Promise<ProductResponse> {
  const product = await db.product.create({
    data: { ...data, createdById },
    include: { createdBy: { select: AUTHOR_SELECT }, updatedBy: { select: AUTHOR_SELECT } },
  });
  return toProductResponse(product);
}

export async function updateProduct(
  updatedById: string,
  id: string,
  data: UpdateProductInput,
): Promise<ProductResponse> {
  const existing = await db.product.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Producto no encontrado.');

  const updated = await db.product.update({
    where: { id },
    data: { ...data, updatedById },
    include: { createdBy: { select: AUTHOR_SELECT }, updatedBy: { select: AUTHOR_SELECT } },
  });
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
