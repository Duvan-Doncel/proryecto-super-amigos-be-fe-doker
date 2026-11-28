<!--
  ¿Qué? Informe de manejo de Scrum de Super Amigos Grooming Spa: roles, product backlog con
  historias de usuario puntuadas, planning poker, sprints, tareas asignadas y seguimiento.
  ¿Para qué? Evidenciar la metodología ágil aplicada al proyecto (criterio 2).
  ¿Impacto? El tablero vivo está en GitHub Projects ("SAG Spa — Scrum"); este documento es el
  informe consolidado y versionado en el repositorio.
-->

# 🏃 Informe de Scrum — Super Amigos Grooming Spa

| Campo | Valor |
|---|---|
| Proyecto | Super Amigos Grooming Spa — Ficha 3228970 |
| Duración de sprint | 2 semanas |
| Tablero | GitHub Projects — [**SAG Spa — Scrum**](https://github.com/users/Duvan-Doncel/projects/1) (26 tarjetas: 23 HUs + 3 de los sprints 5–7, con puntos, sprint, responsable y estado) |
| Fuente de las HUs | [`docs/requisitos/HUs/`](requisitos/HUs/) (24 historias con criterios de aceptación) |

> ⚠️ **Por completar por el equipo antes de entregar**: columna "Responsable" de la sección 3 y
> la votación real del planning poker (sección 4). Las fechas de los sprints 1–4 se reconstruyeron
> a partir de las migraciones de la base de datos y los commits; confirmarlas.

---

## 1. Roles

| Rol Scrum | Integrante | Responsabilidad |
|---|---|---|
| Product Owner | _por definir_ | Prioriza el backlog, representa al negocio (Super Amigos) |
| Scrum Master | _por definir_ | Facilita las ceremonias, quita bloqueos, cuida el proceso |
| Development Team | Santiago Doncel · Álvaro Espejo · Yesid Valencia · Juan Rodríguez | Construye, prueba y documenta |

## 2. Escala de estimación

Puntos de historia con la serie de Fibonacci: **1, 2, 3, 5, 8, 13**. Miden **complejidad e
incertidumbre**, no horas.

| Puntos | Significa | Ejemplo en el proyecto |
|---|---|---|
| 1–2 | Trivial, ya sabemos cómo hacerlo | Ver el perfil, listar mis mascotas |
| 3 | Sencillo con alguna validación | Login, catálogo de productos |
| 5 | Varias reglas o varias pantallas | Registro con verificación, venta de mostrador |
| 8 | Complejo, toca varias tablas o un flujo con estados | Carrito y pedido (stock), registro de mascota con foto y condiciones de piel |
| 13 | Muy complejo, con incertidumbre | Agendar cita (horario, cupo diario, motor de precios, bloqueos) |

## 3. Product backlog (24 historias)

| HU | Historia | Módulo | Prioridad | Puntos | Sprint | Responsable | Estado |
|---|---|---|---|---|---|---|---|
| HU-001 | Registro de cliente | Autenticación | Alta | 5 | 1 | _por confirmar_ | ✅ Hecho |
| HU-002 | Inicio de sesión | Autenticación | Alta | 3 | 1 | _por confirmar_ | ✅ Hecho |
| HU-003 | Verificación de email | Autenticación | Alta | 3 | 1 | _por confirmar_ | ✅ Hecho |
| HU-004 | Cambio de contraseña | Autenticación | Media | 2 | 1 | _por confirmar_ | ✅ Hecho |
| HU-005 | Recuperación de contraseña | Autenticación | Media | 3 | 1 | _por confirmar_ | ✅ Hecho |
| HU-006 | Renovación de sesión (refresh token) | Autenticación | Media | 3 | 1 | _por confirmar_ | ✅ Hecho |
| HU-008 | Creación de cuenta de staff | Autenticación | Media | 2 | 1 | _por confirmar_ | ✅ Hecho |
| HU-012 | Registro de mascota | Mascotas | Alta | 8 | 2 | _por confirmar_ | ✅ Hecho |
| HU-013 | Listado de mascotas del cliente | Mascotas | Alta | 2 | 2 | _por confirmar_ | ✅ Hecho |
| HU-014 | Catálogo de servicios y tarifario | Servicios | Alta | 8 | 2 | _por confirmar_ | ✅ Hecho |
| HU-009 | Agendar cita de grooming 🟢 | Semáforo | Alta | 13 | 2 | _por confirmar_ | ✅ Hecho |
| HU-010 | Reportar síntoma leve 🟡 | Semáforo | Alta | 5 | 2 | _por confirmar_ | ✅ Hecho |
| HU-011 | Emergencia: veterinarias cercanas 🔴 | Semáforo | Media | 5 | 2 | _por confirmar_ | ✅ Hecho |
| HU-017 | Agenda del día (staff) | Agenda del staff | Alta | 5 | 3 | _por confirmar_ | ✅ Hecho |
| HU-018 | Revisar reportes de síntomas | Agenda del staff | Alta | 3 | 3 | _por confirmar_ | ✅ Hecho |
| HU-015 | Ver catálogo de productos | Productos | Alta | 3 | 3 | _por confirmar_ | ✅ Hecho |
| HU-016 | Armar carrito y confirmar pedido | Productos | Alta | 8 | 3 | _por confirmar_ | ✅ Hecho |
| HU-019 | Gestionar pedidos de productos | Agenda del staff | Media | 3 | 3 | _por confirmar_ | ✅ Hecho |
| HU-007 | Perfil de usuario | Autenticación | Media | 2 | 3 | _por confirmar_ | ✅ Hecho |
| HU-020 | Gestionar proveedores | Inventario | Media | 3 | 4 | _por confirmar_ | ✅ Hecho |
| HU-021 | Reabastecer con pedido a proveedor | Inventario | Media | 5 | 4 | _por confirmar_ | ✅ Hecho |
| HU-023 | Registrar venta en el mostrador | Inventario | Media | 5 | 4 | _por confirmar_ | ✅ Hecho |
| HU-022 | Consultar reporte de ventas | Inventario | Baja | 5 | 4 | _por confirmar_ | ✅ Hecho |
| HU-024 | Dar de baja y reactivar clientes conservando su historial | Clientes (staff) | Media | 5 | 7 | _por confirmar_ | ✅ Hecho (PR #35) |
| | | | | **109** | | | |

## 4. Planning poker

**Cómo se hizo**: antes de cada sprint, cada integrante elige en secreto una carta (1, 2, 3, 5, 8,
13) para cada HU; se muestran a la vez. Si hay diferencia de más de un escalón, quien votó más alto
y quien votó más bajo explican su razón y se vuelve a votar hasta llegar a consenso.

| HU | Santiago | Álvaro | Yesid | Juan | Consenso | Discusión |
|---|---|---|---|---|---|---|
| HU-009 Agendar cita | | | | | 13 | _p. ej.: el cupo diario y el motor de precios suben la complejidad_ |
| HU-012 Registro de mascota | | | | | 8 | |
| HU-016 Carrito y pedido | | | | | 8 | |
| HU-014 Servicios y tarifario | | | | | 8 | |
| HU-001 Registro de cliente | | | | | 5 | |
| _(resto de HUs)_ | | | | | ver backlog | |

> El equipo registra aquí sus votos reales. La columna "Consenso" muestra la estimación final
> usada en el backlog.

## 5. Sprints

### Fase 1 — Desarrollo de funcionalidades

| Sprint | Fechas | Objetivo del sprint | HUs | Puntos | Evidencia en el repo |
|---|---|---|---|---|---|
| **1** | 4 – 17 ago 2026 | "Un cliente puede crear su cuenta, verificarla y entrar de forma segura" | 001, 002, 003, 004, 005, 006, 008 | 21 | Módulo `auth`, `email.ts`, `audit-log.ts` |
| **2** | 18 – 31 ago 2026 | "Un cliente registra su mascota y usa el semáforo (cita, síntoma, emergencia)" | 012, 013, 014, 009, 010, 011 | 41 | Migración `init_groomingspa_schema` (26-ago), commit "plataforma completa de citas, síntomas y tienda" (27-ago) |
| **3** | 1 – 14 sep 2026 | "El staff opera la agenda y el cliente compra en la tienda" | 017, 018, 015, 016, 019, 007 | 24 | Migraciones `grooming_pricing_model`, `species_aware_pricing` (1-sep), `add_product_traceability` (5-sep); commits de perfil y rediseño (8-sep) |
| **4** | 15 – 28 sep 2026 | "El negocio controla inventario, proveedores y ventas" | 020, 021, 023, 022 | 18 | Migración `add_pet_photo_url` (17-sep); módulos `suppliers`, `supplier-orders`, `sales` |

**Velocidad**: 21 → 41 → 24 → 18 puntos (promedio **26 puntos por sprint**). El Sprint 2 fue el
de mayor carga: el semáforo concentra la lógica de negocio más compleja (HU-009, 13 puntos).

### Fase 2 — Calidad: bootcamp de pruebas por semanas

Cada integrante rota de capa (Front / API / BD / E2E) cada semana, según
[`matriz-rotacion.md`](matriz-rotacion.md). Cada entrega es un PR revisado por alguien de otra capa.

| Sprint | Fechas | Objetivo | Semanas del bootcamp | PRs |
|---|---|---|---|---|
| **5** | 19 oct – 1 nov 2026 | "Red de pruebas en los tres niveles de la pirámide + CI" | S1 – S4 | #2 – #18 |
| **6** | 2 – 15 nov 2026 | "Dobles de prueba y pruebas contra la BD real" | S5 – S6 | #19 – #25 |
| **7** | 16 – 29 nov 2026 | "Documentación de entrega y presentación (30-nov)" | — | #26 (documentación), #27 (Docker), #34 (rediseño), #35 (HU-024 baja de clientes, límites de entrada y fechas) |

### Tareas por integrante en la Fase 2 (tomadas de la matriz de rotación)

| Integrante | S1 | S2 | S3 | S4 | S5 | S6 |
|---|---|---|---|---|---|---|
| Santiago | E2E: crear cita (#2) | CI + reglas de citas (#5, #7) | Front: AppointmentPage (#9) | API: citas (#13) | BD: citas con dobles (#24) | Front: contrato vs MSW (#25) |
| Álvaro | E2E: login inválido (#3) | BD: mascotas (#11) | Front: LoginForm (#12) | Front: contrato mascotas (#16) | E2E: Mis mascotas (#22) | API: mascotas BD real (#23) |
| Yesid | E2E: registro (#6) | Front: petForm (#8) | Front: RegisterForm (#10) | E2E: seguridad del API (#17) | API: correo con dobles (#19) | BD: proveedores BD real (#20) |
| Juan | E2E: login válido | API: tamaño por peso | Front: ChangePasswordPage | BD: API desde la BD (#15) | Front: cliente HTTP con MSW (#21) | — |

## 6. Ceremonias

> _Ajustar a cómo se hizo realmente (canal, frecuencia)._

| Ceremonia | Cuándo | Qué se hizo |
|---|---|---|
| Sprint planning | Inicio de cada sprint | Selección de HUs del backlog y planning poker |
| Daily | Por WhatsApp | Qué hice, qué haré, qué me bloquea |
| Sprint review | Fin de cada sprint | Demostración de lo terminado (y en la Fase 2, PR mergeado) |
| Retrospectiva | Fin de cada sprint | Qué funcionó y qué mejorar (ver sección 7) |

## 7. Retrospectiva general

| ✅ Qué funcionó | ⚠️ Qué mejorar |
|---|---|
| HUs con criterios de aceptación claros desde el inicio | El código de la Fase 1 quedó en pocos commits grandes: se pierde la trazabilidad de quién hizo cada HU |
| La rotación de capas obligó a todos a conocer FE, BE, BD y E2E | El tablero Scrum se formalizó al final; debió usarse desde el Sprint 1 |
| Las pruebas encontraron defectos reales (500 → 422/404) | Varios PRs de la Fase 2 quedaron abiertos sin revisión |
| CI en cada PR | La cobertura del frontend sigue baja (10,5 %) |
