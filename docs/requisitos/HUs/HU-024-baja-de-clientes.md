<!--
  ¿Qué? Historia de usuario que describe cómo el staff da de baja a un cliente sin borrar su historial.
  ¿Para qué? Formalizar que un cliente que se va no desaparece de los registros del negocio.
  ¿Impacto? Sin esto, la única forma de retirar a un cliente sería borrarlo, y con él sus citas,
  pedidos y la trazabilidad de las ventas.
-->

# HU-024 — Dar de Baja y Reactivar Clientes

## Identificación

| Campo            | Valor                                  |
| ---------------- | -------------------------------------- |
| **ID**           | HU-024                                 |
| **Título**       | Dar de baja y reactivar clientes       |
| **Módulo**       | Clientes (staff)                       |
| **Prioridad**    | Media                                  |
| **Estado**       | Hecho (PR #35)                         |
| **RF asociados** | RF-012                                 |

---

## Historia

**Como** miembro del staff,
**quiero** dar de baja a un cliente que decidió irse, guardando el motivo,
**para** que ya no pueda usar la app ni tenga citas pendientes, sin perder su historial con el negocio.

---

## Criterios de Aceptación

### CA-024.1 — Dar de baja conservando el historial
- **Dado que** un cliente activo decide irse,
- **cuando** lo doy de baja (con un motivo opcional de máximo 300 caracteres),
- **entonces** queda marcado como "Dado de baja" con la fecha y el motivo, y sus citas pasadas,
  ventas y mascotas siguen existiendo.

### CA-024.2 — Cancelar lo pendiente
- **Dado que** el cliente tiene citas desde hoy (pendientes o confirmadas) o pedidos pendientes,
- **cuando** lo doy de baja,
- **entonces** esas citas y pedidos quedan cancelados y el stock de los pedidos vuelve al inventario.

### CA-024.3 — Bloquear el acceso
- **Dado que** un cliente fue dado de baja,
- **cuando** intenta iniciar sesión,
- **entonces** el sistema se lo impide con el mensaje "Esta cuenta fue dada de baja…", y si ya
  tenía una sesión abierta, no puede renovarla.

### CA-024.4 — Reactivar
- **Dado que** un cliente dado de baja vuelve al negocio,
- **cuando** lo reactivo,
- **entonces** puede volver a iniciar sesión (las citas canceladas no se restauran).

### CA-024.5 — Filtrar por estado
- **Dado que** estoy en la pantalla "Clientes",
- **cuando** filtro por "Activos", "Dados de baja" o "Todos",
- **entonces** veo solo ese grupo; los buscadores de mascotas y ventas solo ofrecen clientes activos.

---

## Endpoints

| Método | Ruta                                      | Descripción                         |
| ------ | ----------------------------------------- | ----------------------------------- |
| POST   | `/api/v1/staff/clients/:id/deactivate`    | Da de baja al cliente               |
| POST   | `/api/v1/staff/clients/:id/reactivate`    | Reactiva al cliente                 |
| GET    | `/api/v1/staff/clients?status=...`        | Lista activos, dados de baja o todos |

---

## Notas técnicas

- Es un **borrado lógico**: columnas `users.deactivated_at` y `users.deactivation_reason`
  (migración `20261127065252_baja_de_clientes`). La fila nunca se borra.
- La baja corre en una sola transacción y queda en el log de auditoría (`CLIENT_DEACTIVATED`).
- Pruebas: `be/src/tests/clients-deactivation.test.ts` (12 casos).
