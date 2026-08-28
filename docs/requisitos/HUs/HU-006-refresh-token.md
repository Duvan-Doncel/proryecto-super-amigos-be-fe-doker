<!--
  ¿Qué? Historia de usuario que describe la renovación automática de sesión.
  ¿Para qué? Formalizar que el usuario no deba iniciar sesión cada 15 minutos.
  ¿Impacto? Sin esto, la experiencia sería muy incómoda: la sesión se cerraría constantemente.
-->

# HU-006 — Renovación de Sesión

## Identificación

| Campo            | Valor                  |
| ---------------- | ------------------------ |
| **ID**           | HU-006                    |
| **Título**       | Renovación de sesión        |
| **Módulo**       | Autenticación                 |
| **Prioridad**    | Media                           |
| **Estado**       | Por implementar                  |
| **RF asociados** | RF-006                            |

---

## Historia

**Como** usuario con sesión iniciada,
**quiero** que mi sesión se mantenga activa mientras uso la app,
**para** no tener que iniciar sesión de nuevo cada 15 minutos.

---

## Criterios de Aceptación

### CA-006.1 — Renovación transparente
- **Dado que** mi `accessToken` expiró pero mi `refreshToken` sigue siendo válido,
- **cuando** hago cualquier acción en la app,
- **entonces** el frontend obtiene un nuevo `accessToken` automáticamente, sin que yo lo note.

### CA-006.2 — Refresh token expirado
- **Dado que** mi `refreshToken` también expiró (más de 7 días sin actividad),
- **cuando** intento realizar una acción,
- **entonces** soy redirigido al login con un mensaje indicando que mi sesión expiró.

---

## Endpoints

| Método | Ruta                     | Descripción                                    |
| ------ | ------------------------ | ------------------------------------------------ |
| POST   | `/api/v1/auth/refresh`   | Genera nuevos tokens a partir del refresh token   |

---

## Notas técnicas

- Es un flujo invisible para el usuario, manejado por un interceptor HTTP en el frontend.
