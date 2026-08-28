<!--
  ¿Qué? Requisito funcional que describe cómo el staff gestiona los pedidos de productos (RF-016) hasta su entrega.
  ¿Para qué? Definir el endpoint PUT /api/v1/staff/orders/:id.
  ¿Impacto? Sin esto, un pedido confirmado por el cliente quedaría "pendiente" para siempre.
-->

# RF-019 — Gestión de Pedidos de Productos

**Historia de usuario relacionada**: HU-019

## Descripción

El sistema debe permitir al staff ver los pedidos pendientes de productos y marcarlos como
completados (pagados y entregados) o cancelados, mediante `GET /api/v1/staff/orders`
y `PUT /api/v1/staff/orders/:id`.

---

## Flujo del proceso

| Paso | Descripción                                                                                     |
| ---- | ------------------------------------------------------------------------------------------------ |
| 1    | El staff autenticado envía `GET /api/v1/staff/orders` (siempre retorna solo los pendientes).     |
| 2    | El servicio retorna los pedidos con `status = 'pending'`, con sus líneas y datos del cliente.    |
| 3    | Cuando el cliente llega, paga y recoge: el staff envía `PUT /api/v1/staff/orders/:id` con `{ status: 'completed' }`. |
| 4    | Si el cliente no recoge el pedido: el staff envía `{ status: 'cancelled' }`.                      |
| 5    | Si se cancela, el servicio restaura el `stock` reservado de cada producto del pedido (ver RF-016). |
| 6    | Se retorna HTTP 200 con el pedido actualizado.                                                    |

---

## Reglas de Negocio

| ID     | Regla                                                                                         |
| ------ | ------------------------------------------------------------------------------------------------ |
| RN-190 | Solo un usuario con `role = 'staff'` puede cambiar el estado de un pedido.                        |
| RN-191 | Un pedido `completed` marca automáticamente `paymentStatus = 'paid'` — el staff no lo envía en el body, lo deriva el servidor. |
| RN-192 | Cancelar un pedido restaura automáticamente el `stock` reservado de sus productos.                 |
| RN-193 | Un pedido `completed` o `cancelled` no puede volver a `pending`.                                   |

---

## Inputs / Outputs

**Input** (`PUT /api/v1/staff/orders/:id`):
```json
{ "status": "completed" }
```

**Output éxito** (HTTP 200):
```json
{ "id": "uuid", "status": "completed", "paymentStatus": "paid" }
```

---

## Endpoints

| Método | Ruta                        | Auth requerida    | Descripción                              |
| ------ | --------------------------- | ------------------ | -------------------------------------------- |
| GET    | `/api/v1/staff/orders`      | Sí (role: staff)    | Lista los pedidos pendientes, con líneas y datos del cliente |
| PUT    | `/api/v1/staff/orders/:id`  | Sí (role: staff)    | Marca un pedido como completado o cancelado    |
