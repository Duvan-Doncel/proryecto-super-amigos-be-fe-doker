<!--
  ¿Qué? Requisito funcional que describe la gestión del catálogo de productos (juguetes, artículos, medicamentos).
  ¿Para qué? Definir los endpoints CRUD de /api/v1/products.
  ¿Impacto? Sin catálogo no hay nada que el cliente pueda agregar al carrito (RF-016).
-->

# RF-015 — Catálogo de Productos

**Historia de usuario relacionada**: HU-015

## Descripción

El sistema debe permitir al staff administrar el catálogo de productos (juguetes, artículos,
medicamentos) mediante endpoints CRUD en `/api/v1/products`. El catálogo de productos con
existencia disponible debe poder consultarse públicamente para que el cliente arme su carrito.

---

## Flujo del proceso

| Paso | Descripción                                                                                     |
| ---- | ------------------------------------------------------------------------------------------------ |
| 1    | El staff autenticado envía `POST /api/v1/products` con `{ name, description, price, stock, category }`. |
| 2    | El middleware `authenticate` verifica que `role === 'staff'`; si no, retorna HTTP 403.           |
| 3    | El middleware `validate` verifica el body con el schema Zod `productSchema`.                     |
| 4    | Se inserta el producto en la tabla `products` con `active = true`.                                |
| 5    | Para editar (incluye ajustar `stock` manualmente): `PUT /api/v1/products/:id`.                    |
| 6    | Para eliminar: `DELETE /api/v1/products/:id` — si el producto tiene pedidos asociados, se marca `active = false` en vez de borrarse. |
| 7    | Cualquier persona puede consultar `GET /api/v1/products?active=true` para ver el catálogo vigente. |

---

## Reglas de Negocio

| ID     | Regla                                                                                         |
| ------ | ------------------------------------------------------------------------------------------------ |
| RN-150 | Solo un usuario con `role = 'staff'` puede crear, editar o desactivar productos.                  |
| RN-151 | El campo `price` debe ser un número mayor a 0.                                                    |
| RN-152 | El campo `stock` es un número entero mayor o igual a 0 — representa unidades disponibles para la venta. |
| RN-153 | Un producto con pedidos asociados no se elimina físicamente — se desactiva (`active = false`).    |
| RN-154 | El catálogo público (`GET /api/v1/products`) solo muestra productos con `active = true`.           |
| RN-155 | El `stock` se actualiza automáticamente al confirmarse un pedido (RF-016) o al recibir mercancía de un proveedor (ver módulo de Inventario, RF-020). |

---

## Inputs / Outputs

**Input** (`POST` / `PUT`):
```json
{ "name": "Correa para perro", "description": "string (opcional)", "price": 25000, "stock": 15, "category": "accesorios" }
```

**Output éxito** (HTTP 201/200):
```json
{
  "id": "uuid",
  "name": "Correa para perro",
  "description": "string",
  "price": 25000,
  "stock": 15,
  "category": "accesorios",
  "active": true,
  "createdAt": "timestamp"
}
```

---

## Endpoints

| Método | Ruta                       | Auth requerida    | Descripción                             |
| ------ | -------------------------- | ------------------ | ------------------------------------------- |
| GET    | `/api/v1/products`         | No                  | Lista los productos activos                  |
| POST   | `/api/v1/products`         | Sí (role: staff)    | Crea un nuevo producto                        |
| PUT    | `/api/v1/products/:id`     | Sí (role: staff)    | Edita un producto (precio, stock, activo)      |
| DELETE | `/api/v1/products/:id`     | Sí (role: staff)    | Elimina o desactiva un producto                 |
