/**
 * Archivo: types/orders.ts
 * Descripción: Tipos TypeScript para el carrito y los pedidos de productos (RF-016, RF-019).
 */

export type OrderStatus = 'pending' | 'completed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid';

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  clientId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  total: number;
  items: OrderItem[];
  createdAt: string;
}

export interface CreateOrderRequest {
  items: { productId: string; quantity: number }[];
}

// ¿Qué? Forma enriquecida usada en la bandeja del staff (RF-019).
export interface StaffOrder extends Order {
  client: { id: string; firstName: string; lastName: string; phone: string | null };
}

// ¿Qué? Respuesta mínima al cambiar el estado de un pedido (RF-019) — no repite líneas ni total.
export interface OrderStatusUpdateResult {
  id: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
}
