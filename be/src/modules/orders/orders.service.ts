/**
 * Archivo: modules/orders/orders.service.ts
 * Descripción: Lógica de negocio del carrito y los pedidos de productos (RF-016, RF-019).
 * ¿Para qué? No hay pago en línea — el pedido se confirma, se reserva el stock, y el
 *   cliente paga presencialmente al recoger. El staff cierra el ciclo (RF-019).
 * ¿Impacto? El precio de cada línea SIEMPRE se toma del catálogo en el servidor —
 *   nunca del payload del cliente (RN-161), para que nadie pueda pagar menos manipulando el body.
 */

import { db } from '../../db/index.js';
import { NotFoundError, ConflictError, BadRequestError } from '../../middlewares/error.middleware.js';
import type { CreateOrderInput, UpdateOrderStatusInput } from './orders.schema.js';

export interface OrderResponse {
  id: string;
  clientId: string;
  status: string;
  paymentStatus: string;
  total: number;
  items: { productId: string; name: string; quantity: number; unitPrice: number }[];
  createdAt: Date;
}

// ¿Qué? Forma enriquecida de un pedido para la bandeja del staff (RF-019) — incluye
//   los datos del cliente que debe recoger y pagar el pedido en el local.
export interface StaffOrderResponse extends OrderResponse {
  client: { id: string; firstName: string; lastName: string; phone: string | null };
}

// ¿Qué? Confirma un pedido a partir del carrito (RF-016).
// ¿Para qué? Valida stock, calcula el total en el servidor y reserva (descuenta) el
//   stock de cada producto dentro de una única transacción — o todo se aplica, o nada.
export async function createOrder(clientId: string, data: CreateOrderInput): Promise<OrderResponse> {
  return db.$transaction(async (tx) => {
    let total = 0;
    const lineItems: { productId: string; name: string; quantity: number; unitPrice: number }[] = [];

    for (const item of data.items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });

      if (!product || !product.active) {
        throw new NotFoundError(`Producto no encontrado: ${item.productId}`);
      }
      if (product.stock < item.quantity) {
        throw new ConflictError(`Stock insuficiente para el producto: ${product.name}`);
      }

      const unitPrice = Number(product.price);
      total += unitPrice * item.quantity;
      lineItems.push({ productId: product.id, name: product.name, quantity: item.quantity, unitPrice });

      // RN-163: se reserva (descuenta) el stock de inmediato, al crear el pedido.
      await tx.product.update({
        where: { id: product.id },
        data: { stock: { decrement: item.quantity } },
      });
    }

    const order = await tx.order.create({
      data: {
        clientId,
        total,
        items: {
          create: lineItems.map((li) => ({
            productId: li.productId,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
          })),
        },
      },
    });

    return { id: order.id, clientId, status: order.status, paymentStatus: order.paymentStatus, total, items: lineItems, createdAt: order.createdAt };
  });
}

// ¿Qué? Lista los pedidos del cliente autenticado, con sus líneas, más recientes primero.
export async function listMyOrders(clientId: string): Promise<OrderResponse[]> {
  const orders = await db.order.findMany({
    where: { clientId },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return orders.map((o) => ({
    id: o.id,
    clientId: o.clientId,
    status: o.status,
    paymentStatus: o.paymentStatus,
    total: Number(o.total),
    items: o.items.map((i) => ({
      productId: i.productId,
      name: i.product.name,
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
    })),
    createdAt: o.createdAt,
  }));
}

// ¿Qué? Lista los pedidos pendientes, para la bandeja del staff (RF-019).
export async function listPendingOrders(): Promise<StaffOrderResponse[]> {
  const orders = await db.order.findMany({
    where: { status: 'pending' },
    include: { items: { include: { product: true } }, client: true },
    orderBy: { createdAt: 'asc' },
  });

  return orders.map((o) => ({
    id: o.id,
    clientId: o.clientId,
    status: o.status,
    paymentStatus: o.paymentStatus,
    total: Number(o.total),
    items: o.items.map((i) => ({
      productId: i.productId,
      name: i.product.name,
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
    })),
    createdAt: o.createdAt,
    client: { id: o.client.id, firstName: o.client.firstName, lastName: o.client.lastName, phone: o.client.phone },
  }));
}

// ¿Qué? El staff marca un pedido como completado (pagado y entregado) o cancelado (RF-019).
// ¿Impacto? Cancelar restaura el stock reservado (RN-192); completar exige marcar el pago (RN-191).
export async function updateOrderStatus(
  id: string,
  data: UpdateOrderStatusInput,
): Promise<{ id: string; status: string; paymentStatus: string }> {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) throw new NotFoundError('Pedido no encontrado.');

    if (order.status !== 'pending') {
      throw new BadRequestError(`El pedido ya está en estado final (${order.status}) y no puede modificarse.`);
    }

    if (data.status === 'cancelled') {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    const updated = await tx.order.update({
      where: { id },
      data: {
        status: data.status,
        paymentStatus: data.status === 'completed' ? 'paid' : order.paymentStatus,
      },
    });

    return { id: updated.id, status: updated.status, paymentStatus: updated.paymentStatus };
  });
}
