<!--
  ¿Qué? Requisito funcional que describe el reporte de ventas de productos.
  ¿Para qué? Definir el endpoint GET /api/v1/staff/sales-report.
  ¿Impacto? Permite al staff ver cuánto se ha vendido sin llevar cuentas aparte en papel o Excel.
-->

# RF-022 — Reporte de Ventas

**Historia de usuario relacionada**: HU-022

## Descripción

El sistema debe permitir al staff consultar un reporte de ventas de productos en un rango de
fechas, mediante `GET /api/v1/staff/sales-report?from=...&to=...`.

El reporte combina dos fuentes: los pedidos hechos desde el carrito de la app (RF-016) que ya
quedaron en `status = 'completed'` y `paymentStatus = 'paid'`, y las ventas registradas
manualmente en el mostrador (RF-023). Ninguna de las dos se vuelve a digitar aparte — el reporte
simplemente las suma.

---

## Flujo del proceso

| Paso | Descripción                                                                                     |
| ---- | ------------------------------------------------------------------------------------------------ |
| 1    | El staff envía `GET /api/v1/staff/sales-report?from=2026-08-01&to=2026-08-31`.                   |
| 2    | El middleware `authenticate` verifica que `role === 'staff'`.                                     |
| 3    | El servicio suma el `total` de todos los `orders` con `status = 'completed'` **y** de todas las `sales` manuales, dentro de ese rango de fechas. |
| 4    | Se retorna HTTP 200 con el total vendido, la cantidad de transacciones y el detalle por producto.  |

---

## Reglas de Negocio

| ID     | Regla                                                                                         |
| ------ | ------------------------------------------------------------------------------------------------ |
| RN-220 | Solo un usuario con `role = 'staff'` puede consultar el reporte de ventas.                        |
| RN-221 | Solo se cuentan pedidos con `status = 'completed'` y `paymentStatus = 'paid'`, y ventas manuales (RF-023) — un pedido cancelado o pendiente no cuenta como venta. |
| RN-222 | El rango de fechas (`from`, `to`) es obligatorio para evitar reportes sin límite.                   |

---

## Inputs / Outputs

**Output** (HTTP 200):
```json
{
  "from": "2026-08-01",
  "to": "2026-08-31",
  "totalRevenue": 1250000,
  "totalOrders": 34,
  "byProduct": [
    { "productId": "uuid", "name": "Correa para perro", "unitsSold": 12, "revenue": 300000 }
  ]
}
```

---

## Endpoint

| Método | Ruta                              | Auth requerida    | Descripción                     |
| ------ | ---------------------------------- | ------------------ | ----------------------------------- |
| GET    | `/api/v1/staff/sales-report`       | Sí (role: staff)    | Retorna el reporte de ventas por rango de fechas |
