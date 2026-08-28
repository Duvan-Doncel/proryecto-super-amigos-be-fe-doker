<!--
  ¿Qué? Historia de usuario que describe cómo un miembro del staff crea otra cuenta de staff.
  ¿Para qué? Formalizar la gestión de personal interno sin exponer un registro público.
  ¿Impacto? Sin esto, dar de alta a un nuevo empleado requeriría tocar la base de datos directamente.
-->

# HU-008 — Creación de Cuenta de Staff

## Identificación

| Campo            | Valor                        |
| ---------------- | ------------------------------ |
| **ID**           | HU-008                          |
| **Título**       | Creación de cuenta de staff     |
| **Módulo**       | Autenticación                    |
| **Prioridad**    | Media                             |
| **Estado**       | Por implementar                  |
| **RF asociados** | RF-008                            |

---

## Historia

**Como** miembro del staff ya autenticado,
**quiero** crear una cuenta para un nuevo compañero de trabajo,
**para** que también pueda usar el panel administrativo sin que yo tenga que tocar la base de datos.

---

## Criterios de Aceptación

### CA-003.1 — Acceso restringido
- **Dado que** inicié sesión como cliente,
- **cuando** intento acceder a la pantalla de creación de staff,
- **entonces** el sistema me lo impide (HTTP 403) y no veo esa opción en el menú.

### CA-003.2 — Formulario de creación de staff
- **Dado que** inicié sesión como staff,
- **cuando** abro la pantalla "Crear cuenta de staff",
- **entonces** veo campos para nombre, apellido, correo y contraseña.

### CA-003.3 — Correo duplicado
- **Dado que** intento crear un staff con un correo que ya existe en el sistema,
- **cuando** envío el formulario,
- **entonces** veo un mensaje de error indicando que el correo ya está registrado.

### CA-003.4 — Creación exitosa
- **Dado que** completé el formulario correctamente,
- **cuando** lo envío,
- **entonces** la nueva cuenta queda creada con `role = 'staff'` y aparece en el listado de staff.

---

## Endpoints

| Método | Ruta             | Descripción                       |
| ------ | ---------------- | ------------------------------------ |
| POST   | `/api/v1/staff`  | Crea una nueva cuenta de staff       |

---

## Notas técnicas

- Requiere JWT válido con `role = 'staff'` — se valida con el mismo `authMiddleware` usado en el resto del panel administrativo.
- La primera cuenta de staff del sistema no se crea por este flujo — se crea directamente en la base de datos (seed) al desplegar el proyecto.
