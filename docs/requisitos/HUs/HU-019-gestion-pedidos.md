<!--
  ¿Qué? Historia de usuario que describe la gestión de pedidos de productos por el staff.
  ¿Para qué? Formalizar cómo el staff cierra el ciclo de venta iniciado en HU-016.
  ¿Impacto? Sin esto, un pedido confirmado por el cliente nunca se marcaría como entregado.
-->

# HU-019 — Gestionar Pedidos de Productos

## Identificación

| Campo            | Valor                  |
| ---------------- | -------------------------- |
| **ID**           | HU-019                        |
| **Título**       | Gestionar pedidos de productos   |
| **Módulo**       | Agenda del staff                    |
| **Prioridad**    | Media                                  |
| **Estado**       | Por implementar                         |
| **RF asociados** | RF-019                                    |

---

## Historia

**Como** miembro del staff,
**quiero** ver los pedidos de productos pendientes de recoger y marcarlos como pagados/entregados,
**para** llevar el control de qué se apartó y qué ya se cobró.

---

## Criterios de Aceptación

### CA-019.1 — Lista de pedidos pendientes
- **Dado que** inicié sesión como staff,
- **cuando** abro "Pedidos pendientes",
- **entonces** veo los pedidos sin completar, con cliente, productos, cantidades y total.

### CA-019.2 — Marcar como pagado y entregado
- **Dado que** el cliente llega, paga y se lleva su pedido,
- **cuando** lo marco como completado,
- **entonces** el pedido pasa a estado "completado" con el pago registrado.

### CA-019.3 — Cancelar pedido no recogido
- **Dado que** un cliente no recogió su pedido,
- **cuando** lo cancelo,
- **entonces** el pedido pasa a "cancelado" y el stock reservado de esos productos vuelve a estar disponible.

---

## Endpoints

| Método | Ruta                        | Descripción                              |
| ------ | --------------------------- | ---------------------------------------------- |
| GET    | `/api/v1/staff/orders`      | Lista los pedidos por estado                     |
| PUT    | `/api/v1/orders/:id`        | Marca un pedido como completado o cancelado       |
