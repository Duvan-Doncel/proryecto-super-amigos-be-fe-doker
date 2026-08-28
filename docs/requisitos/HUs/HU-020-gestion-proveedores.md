<!--
  ¿Qué? Historia de usuario que describe la gestión de proveedores.
  ¿Para qué? Formalizar la necesidad de llevar registro de a quién se le compran los productos.
  ¿Impacto? Sin proveedores registrados no se puede generar un pedido de reabastecimiento.
-->

# HU-020 — Gestionar Proveedores

## Identificación

| Campo            | Valor              |
| ---------------- | -------------------- |
| **ID**           | HU-020                |
| **Título**       | Gestionar proveedores    |
| **Módulo**       | Inventario y Proveedores    |
| **Prioridad**    | Media                          |
| **Estado**       | Por implementar                  |
| **RF asociados** | RF-020                            |

---

## Historia

**Como** miembro del staff,
**quiero** registrar y editar los proveedores con sus datos de contacto,
**para** saber a quién pedirle reabastecimiento de productos.

---

## Criterios de Aceptación

### CA-020.1 — Crear proveedor
- **Dado que** inicié sesión como staff,
- **cuando** completo el formulario de nuevo proveedor y lo envío,
- **entonces** el proveedor aparece en el listado.

### CA-020.2 — Editar proveedor
- **Dado que** un proveedor ya existe,
- **cuando** edito sus datos de contacto,
- **entonces** los cambios se reflejan de inmediato.

### CA-020.3 — Desactivar proveedor con pedidos
- **Dado que** un proveedor tiene pedidos asociados,
- **cuando** intento eliminarlo,
- **entonces** el sistema lo desactiva en vez de borrarlo.

---

## Endpoints

| Método | Ruta                        | Descripción            |
| ------ | --------------------------- | -------------------------- |
| GET    | `/api/v1/suppliers`         | Lista los proveedores        |
| POST   | `/api/v1/suppliers`         | Crea un proveedor              |
| PUT    | `/api/v1/suppliers/:id`     | Edita un proveedor               |
| DELETE | `/api/v1/suppliers/:id`     | Elimina o desactiva un proveedor  |
