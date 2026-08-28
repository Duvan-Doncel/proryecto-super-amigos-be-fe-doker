<!--
  ¿Qué? Historia de usuario que describe el cambio de contraseña de un usuario ya autenticado.
  ¿Para qué? Formalizar la necesidad de actualizar la contraseña sin cerrar sesión.
  ¿Impacto? Sin esto, un usuario que quiera reforzar su seguridad tendría que usar la recuperación por correo.
-->

# HU-004 — Cambio de Contraseña

## Identificación

| Campo            | Valor                    |
| ---------------- | -------------------------- |
| **ID**           | HU-004                      |
| **Título**       | Cambio de contraseña         |
| **Módulo**       | Autenticación                 |
| **Prioridad**    | Media                          |
| **Estado**       | Por implementar                |
| **RF asociados** | RF-004                          |

---

## Historia

**Como** usuario autenticado (cliente o staff),
**quiero** cambiar mi contraseña ingresando la actual y la nueva,
**para** mantener mi cuenta segura sin tener que cerrar sesión.

---

## Criterios de Aceptación

### CA-004.1 — Contraseña actual incorrecta
- **Dado que** ingreso mal mi contraseña actual,
- **cuando** envío el formulario,
- **entonces** debo ver el mensaje: "La contraseña actual es incorrecta".

### CA-004.2 — Nueva contraseña igual a la actual
- **Dado que** ingreso la misma contraseña actual como nueva contraseña,
- **cuando** envío el formulario,
- **entonces** debo ver el mensaje: "La nueva contraseña debe ser diferente a la actual".

### CA-004.3 — Cambio exitoso
- **Dado que** ingreso correctamente mi contraseña actual y una nueva válida,
- **cuando** envío el formulario,
- **entonces** mi contraseña queda actualizada y veo un mensaje de confirmación.

---

## Endpoints

| Método | Ruta                             | Descripción                       |
| ------ | --------------------------------- | ------------------------------------ |
| POST   | `/api/v1/auth/change-password`    | Cambia la contraseña del usuario     |

---

## Notas técnicas

- Requiere `accessToken` válido en el header `Authorization`.
