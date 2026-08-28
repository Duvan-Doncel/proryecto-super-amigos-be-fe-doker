<!--
  ¿Qué? Historia de usuario que describe la revisión de reportes de síntomas por el staff.
  ¿Para qué? Formalizar la contraparte de HU-010 desde el lado del staff.
  ¿Impacto? Sin esto, los clientes nunca recibirían respuesta a sus reportes.
-->

# HU-018 — Revisar Reportes de Síntomas

## Identificación

| Campo            | Valor                    |
| ---------------- | ---------------------------- |
| **ID**           | HU-018                          |
| **Título**       | Revisar reportes de síntomas       |
| **Módulo**       | Agenda del staff                     |
| **Prioridad**    | Alta                                    |
| **Estado**       | Por implementar                          |
| **RF asociados** | RF-018                                    |

---

## Historia

**Como** miembro del staff (auxiliar en veterinaria),
**quiero** ver los reportes de síntomas pendientes y responder con una recomendación,
**para** orientar al cliente sobre qué hacer con su mascota.

---

## Criterios de Aceptación

### CA-018.1 — Lista de reportes pendientes
- **Dado que** inicié sesión como staff,
- **cuando** abro "Reportes pendientes",
- **entonces** veo la lista de reportes de síntomas sin revisar, con mascota, cliente y descripción.

### CA-018.2 — Responder un reporte
- **Dado que** abro un reporte pendiente,
- **cuando** escribo una recomendación y la envío,
- **entonces** el reporte pasa a estado "revisado" y el cliente puede verla en su app.

### CA-018.3 — Recomendación obligatoria
- **Dado que** intento marcar un reporte como revisado sin escribir nada,
- **cuando** envío el formulario,
- **entonces** veo un mensaje pidiendo completar la recomendación.

---

## Endpoints

| Método | Ruta                                    | Descripción                                   |
| ------ | ---------------------------------------- | -------------------------------------------------- |
| GET    | `/api/v1/staff/symptom-reports`          | Lista los reportes de síntomas pendientes            |
| PUT    | `/api/v1/symptom-reports/:id`            | Marca un reporte como revisado con recomendación      |
