<!--
  ¿Qué? Historia de usuario que describe cómo el cliente ve el catálogo de productos.
  ¿Para qué? Formalizar la necesidad de mostrar productos disponibles antes de armar el carrito.
  ¿Impacto? Sin catálogo visible, el cliente no sabría qué puede comprar.
-->

# HU-015 — Ver Catálogo de Productos

## Identificación

| Campo            | Valor                    |
| ---------------- | ---------------------------- |
| **ID**           | HU-015                          |
| **Título**       | Ver catálogo de productos          |
| **Módulo**       | Productos                             |
| **Prioridad**    | Alta                                     |
| **Estado**       | Por implementar                           |
| **RF asociados** | RF-015                                     |

---

## Historia

**Como** cliente,
**quiero** ver el catálogo de productos disponibles (juguetes, artículos, medicamentos) con su precio,
**para** decidir qué agregar a mi carrito.

---

## Criterios de Aceptación

### CA-015.1 — Catálogo visible
- **Dado que** entro a la sección de productos,
- **cuando** se carga la pantalla,
- **entonces** veo los productos activos con nombre, precio y categoría.

### CA-015.2 — Producto sin stock
- **Dado que** un producto tiene `stock = 0`,
- **cuando** lo veo en el catálogo,
- **entonces** aparece marcado como "Agotado" y no puedo agregarlo al carrito.

### CA-015.3 — Gestión desde el staff
- **Dado que** inicié sesión como staff,
- **cuando** entro al módulo de productos,
- **entonces** puedo crear, editar (incluyendo precio y stock) y desactivar productos.

---

## Endpoints

| Método | Ruta                       | Descripción                     |
| ------ | -------------------------- | ----------------------------------- |
| GET    | `/api/v1/products`         | Lista los productos activos           |
| POST   | `/api/v1/products`         | Crea un producto (staff)               |
| PUT    | `/api/v1/products/:id`     | Edita un producto (staff)               |
| DELETE | `/api/v1/products/:id`     | Elimina o desactiva un producto (staff)  |
