<!--
  ¿Qué? Historia de usuario que describe la consulta del perfil propio.
  ¿Para qué? Formalizar cómo el frontend obtiene los datos del usuario autenticado.
  ¿Impacto? Sin esto, el frontend no sabría qué nombre o rol mostrar tras iniciar sesión.
-->

# HU-007 — Perfil de Usuario

## Identificación

| Campo            | Valor              |
| ---------------- | -------------------- |
| **ID**           | HU-007                |
| **Título**       | Perfil de usuario       |
| **Módulo**       | Autenticación             |
| **Prioridad**    | Media                       |
| **Estado**       | Por implementar              |
| **RF asociados** | RF-007                        |

---

## Historia

**Como** usuario autenticado,
**quiero** que la app muestre mis datos (nombre, correo, rol),
**para** confirmar que inicié sesión con la cuenta correcta.

---

## Criterios de Aceptación

### CA-007.1 — Datos visibles tras iniciar sesión
- **Dado que** inicié sesión correctamente,
- **cuando** la app carga,
- **entonces** veo mi nombre en la cabecera de la pantalla.

### CA-007.2 — Token inválido
- **Dado que** mi token no es válido (manipulado o corrupto),
- **cuando** la app intenta cargar mi perfil,
- **entonces** soy redirigido al login.

---

## Endpoints

| Método | Ruta                 | Descripción                     |
| ------ | -------------------- | ---------------------------------- |
| GET    | `/api/v1/users/me`   | Retorna el perfil del usuario       |

---

## Notas técnicas

- Requiere `accessToken` válido en el header `Authorization`.
