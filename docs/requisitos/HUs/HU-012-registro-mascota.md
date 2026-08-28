<!--
  ¿Qué? Historia de usuario que describe cómo el staff registra una mascota.
  ¿Para qué? Formalizar el paso previo necesario para que un cliente pueda usar el semáforo.
  ¿Impacto? Sin esto, ningún cliente podría agendar citas ni reportar síntomas.
-->

# HU-012 — Registro de Mascota

## Identificación

| Campo            | Valor                |
| ---------------- | ---------------------- |
| **ID**           | HU-012                   |
| **Título**       | Registro de mascota         |
| **Módulo**       | Mascotas                       |
| **Prioridad**    | Alta                              |
| **Estado**       | Por implementar                    |
| **RF asociados** | RF-012                              |

---

## Historia

**Como** miembro del staff,
**quiero** registrar la mascota de un cliente con sus datos básicos,
**para** que ese cliente pueda luego agendar citas y reportar síntomas desde la app.

---

## Criterios de Aceptación

### CA-012.1 — Formulario de registro de mascota
- **Dado que** inicié sesión como staff y busco a un cliente,
- **cuando** abro "Registrar mascota",
- **entonces** veo campos para nombre, especie, raza, género y edad.

### CA-012.2 — Cliente inexistente
- **Dado que** intento registrar una mascota para un cliente que no existe,
- **cuando** envío el formulario,
- **entonces** veo un mensaje de error indicando que el cliente no fue encontrado.

### CA-012.3 — Registro exitoso
- **Dado que** completé el formulario con un cliente válido,
- **cuando** lo envío,
- **entonces** la mascota queda registrada y visible en el listado de mascotas de ese cliente.

---

## Endpoints

| Método | Ruta            | Descripción                          |
| ------ | --------------- | --------------------------------------- |
| POST   | `/api/v1/pets`  | Registra una mascota para un cliente     |

---

## Notas técnicas

- Solo un usuario con `role = 'staff'` puede acceder a esta pantalla y a este endpoint.
