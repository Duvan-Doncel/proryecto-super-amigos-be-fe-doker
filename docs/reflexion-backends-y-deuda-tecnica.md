<!--
  ¿Qué? Reflexión comparativa de los 4 backends que construyó el equipo para Super Amigos
  Grooming Spa durante el programa, y registro priorizado de la deuda técnica del backend actual.
  ¿Para qué? Mostrar qué se aprendió en cada iteración, por qué el 4.° backend
  (Express + TypeScript + Prisma) es el que va a producción, y qué falta para llevarlo ahí.
  ¿Impacto? Sin este documento, la evolución del proyecto y sus riesgos conocidos solo
  vivirían en la memoria del equipo.
-->

# 🔁 Reflexión de los 4 backends y deuda técnica

| Campo | Valor |
|---|---|
| Proyecto | Super Amigos Grooming Spa — Ficha 3228970 |
| Equipo | Santiago Doncel · Álvaro Espejo · Yesid Valencia · Juan Rodríguez |
| Fecha | Noviembre 2026 |
| Backend de producción | **4.° — Express 5 + TypeScript + Prisma + PostgreSQL** (este repositorio) |

---

## 1. Los 4 backends del programa

Durante el programa el mismo negocio (peluquería y spa para mascotas) se construyó **cuatro
veces**, cada una con un stack distinto y con lo aprendido en la anterior.

| # | Periodo | Stack | Alcance alcanzado |
|---|---|---|---|
| 1 | Marzo 2026 | **Spring Boot 3.3 + Java 17 + JPA + H2** (BD en memoria) | CRUD de usuarios, clientes y mascotas con validación (`@NotBlank`, `@Email`) |
| 2 | Mayo 2026 | **Spring Boot 4.0 + Java 21 + JPA + MySQL** + OpenAPI (springdoc) | CRUD de mascotas persistido en MySQL + consumo de API externa (imágenes de perros) con `RestTemplate` |
| 3 | Junio 2026 | **Node.js + Express 5 (JavaScript) + `pg` + PostgreSQL** | CRUD genérico de clientes, administradores, veterinarias y facturas; login y correo con nodemailer; dashboard |
| 4 | Agosto – noviembre 2026 | **Node 22 + Express 5 + TypeScript + Prisma 7 + PostgreSQL 17** + React 19 | Sistema completo: 14 módulos, 60 endpoints, 22 tablas, JWT con roles, motor de precios, 170 pruebas automatizadas, Docker y CI |

## 2. Comparación

| Criterio | 1 · Spring + H2 | 2 · Spring + MySQL | 3 · Express JS + pg | 4 · Express TS + Prisma |
|---|---|---|---|---|
| Lenguaje / tipado | Java — fuerte | Java — fuerte | JavaScript — **sin tipos** | TypeScript `strict` — fuerte |
| Acceso a datos | JPA/Hibernate | JPA/Hibernate | SQL a mano con `pg` | Prisma ORM (tipos generados) |
| Esquema de BD | `ddl-auto` (lo genera Hibernate) | `ddl-auto=update` | Tablas creadas a mano | **Migraciones versionadas** (9) |
| Persistencia | ❌ En memoria (se pierde al reiniciar) | ✅ MySQL | ✅ PostgreSQL | ✅ PostgreSQL |
| Validación de entrada | Bean Validation | Ninguna | Middleware manual | **zod** en cada ruta (422 legible) |
| Contraseñas | — | — | ❌ **Texto plano** (se comparan en el `WHERE`) | ✅ bcrypt |
| Autenticación | Ninguna | Ninguna | Login sin token ni sesión | ✅ JWT access + refresh, verificación de email |
| Autorización por rol | ❌ | ❌ | ❌ Rutas abiertas | ✅ `requireRole('client' \| 'staff')` |
| Manejo de errores | Por defecto de Spring | Por defecto de Spring | ❌ Devuelve `err.message` al cliente | ✅ Formato único `{ success, error: { code, message } }`, sin stack traces |
| Seguridad HTTP | — | — | CORS abierto | helmet, CORS acotado, rate limit, audit log |
| Configuración | `application.properties` | Credenciales en el archivo | `.env` sin validar | `.env` **validado con zod** al arrancar (fail-fast) |
| Documentación API | — | ✅ Swagger automático | — | Markdown manual (60 endpoints) |
| Pruebas | 1 (contexto) | 1 (contexto) | 0 | **170** (unitarias, integración, E2E) + CI |
| Despliegue | `mvn spring-boot:run` | `mvn` + MySQL local | `nodemon` | **Docker Compose** (db, mail, be, fe) |
| Organización del código | Capas (controller/service/repository) | Capas | Rutas + controlador CRUD genérico | **Módulos por dominio** con capas internas |

## 3. Qué aprendimos en cada salto

**1 → 2 (H2 → MySQL)**: una BD en memoria sirve para arrancar, pero el negocio necesita que los
datos sobrevivan a un reinicio. También aprendimos a consumir una API externa y a documentar el
API con Swagger. Como contra, se perdió la validación que sí tenía la versión 1.

**2 → 3 (Java → JavaScript)**: Express permitió avanzar mucho más rápido en funcionalidades
(login, correo, facturas, dashboard) con menos código. Pero la velocidad tuvo un precio que
descubrimos después: **sin tipos, sin validación central y con contraseñas en texto plano**, el
backend funcionaba pero no era seguro. Un CRUD genérico con nombres de tabla interpolados en el
SQL es cómodo, pero acopla el API a la estructura de la BD.

**3 → 4 (JavaScript → TypeScript + Prisma)**: mantuvimos la productividad de Express y
recuperamos la seguridad de tipos de Java. Prisma nos dio migraciones (el esquema queda en el
historial de Git) y consultas parametrizadas; zod movió las validaciones al borde. Aquí el
equipo pasó de "que funcione" a **"que funcione, sea seguro y esté probado"**: JWT con roles,
bcrypt, formato de error único, pruebas en los tres niveles de la pirámide y CI en cada PR.
Además, migramos de Drizzle a Prisma cuando una auditoría encontró un CVE de SQL injection en la
versión de Drizzle: la elección del ORM también es una decisión de seguridad.

## 4. ¿Por qué el 4.° backend va a producción?

1. **Seguridad**: es el único con contraseñas hasheadas, autenticación, roles y errores sin fuga
   de información.
2. **Confiabilidad**: 170 pruebas automáticas y CI que bloquea un PR si algo se rompe o baja la cobertura.
3. **Mantenibilidad**: TypeScript estricto y módulos independientes; un cambio en el esquema
   rompe la compilación antes de llegar al usuario.
4. **Portabilidad**: con Docker Compose el sistema completo se levanta igual en cualquier equipo.
5. **Un solo lenguaje** en frontend y backend (TypeScript), lo que facilita la rotación de
   capas del equipo.

**Lo que extrañamos de Spring Boot**: la documentación Swagger automática (hoy la mantenemos a
mano) y un framework de inyección de dependencias que haga más fácil reemplazar piezas en las pruebas.

---

## 5. Deuda técnica del backend actual (priorizada)

**Criterio de prioridad** = impacto (riesgo para el usuario o el negocio) × urgencia antes de
producción, ajustado por esfuerzo.
**P1** = bloquea producción · **P2** = alto, resolver en el siguiente sprint · **P3** = medio ·
**P4** = bajo / mejora.

| ID | Prioridad | Tipo | Deuda | Impacto | Esfuerzo | Acción propuesta |
|---|---|---|---|---|---|---|
| DT-01 | 🔴 P1 | Seguridad | `pnpm audit --prod` (26-nov-2026): **backend 36 avisos** (1 crítico en `proxy-addr`, altos en `multer`, `body-parser`, `nodemailer`, `zod`, `mysql2`…), **frontend 15** (`axios`, `follow-redirects`). En agosto estaba en 0. | Vulnerabilidades conocidas y públicas en dependencias de producción | Bajo | `pnpm update` dentro de rango + bumps puntuales; re-correr pruebas; agregar `pnpm audit` al CI |
| DT-02 | 🔴 P1 | Infraestructura | **No hay despliegue real**: solo Docker local, sin HTTPS, con secretos y SMTP de ejemplo | El sistema no está disponible para el negocio | Medio | Desplegar (p. ej. Render/Railway + PostgreSQL gestionado), secretos reales, SMTP real |
| DT-03 | 🔴 P1 | Seguridad | Tokens JWT guardados en `localStorage` y **sin logout en el servidor** (el refresh token no se puede revocar) | Un XSS podría robar la sesión; un token filtrado vale 7 días | Medio | Refresh token en cookie `httpOnly` + tabla de tokens revocados / rotación |
| DT-04 | 🟠 P2 | Proceso | 6 PRs abiertos y 3 ramas sin PR: incluyen **2 correcciones de defectos** (500 → 422/404) que no están en `main` | Defectos conocidos siguen en la rama principal | Bajo | Revisar y mergear los PRs de las semanas 4–6 |
| DT-05 | 🟠 P2 | Pruebas | Sin pruebas automatizadas en síntomas, emergencia, tienda/pedidos, pedidos a proveedor y ventas | Cambios en inventario o ventas pueden romperse sin aviso | Medio | Pruebas de integración por módulo, empezando por ventas y pedidos (mueven stock) |
| DT-06 | 🟠 P2 | Pruebas | Cobertura del frontend **10,5 %** con umbral de 1 % | Las pantallas de staff no tienen red de seguridad | Medio | Subir el umbral semana a semana; probar páginas de staff |
| DT-07 | 🟡 P3 | Pruebas / CI | Las pruebas E2E (Playwright) no corren en el CI | Un flujo completo roto solo se detecta a mano | Medio | Job de CI con `docker compose up` + Playwright |
| DT-08 | 🟡 P3 | Infraestructura | Fotos de mascotas en disco local (`be/uploads`, bind mount) | Se pierden al cambiar de servidor; no escala a varias instancias | Medio | Almacenamiento de objetos (S3, Cloudinary…) |
| DT-09 | 🟡 P3 | Documentación | `be/README.md`, `fe/README.md` y `docs/setup/` son de la plantilla base (solo auth); `BITACORA.md` sin completar | Un integrante nuevo se orienta con información incompleta | Bajo | Actualizar con los módulos de GroomingSpa; completar la bitácora |
| DT-10 | 🟡 P3 | Documentación | La documentación del API es manual (Markdown) | Se puede desactualizar respecto al código | Medio | Generar OpenAPI desde los schemas zod (p. ej. `zod-to-openapi`) + Swagger UI |
| DT-11 | 🟡 P3 | Contenido | Cifras de la landing y testimonios son **de ejemplo** (marcados con `TODO` en `fe/src/config/landing.ts` y `fe/src/data/testimonials.ts`) | Información no verificada frente a clientes reales | Bajo | Reemplazar con datos reales del negocio |
| DT-12 | 🟢 P4 | Seguridad | Rate limiting solo en `/auth` | Abuso posible en endpoints públicos (catálogo, tarifario) | Bajo | Límite general más laxo para el resto del API |
| DT-13 | 🟢 P4 | Calidad | 3 avisos de ESLint en el frontend (directivas `eslint-disable` sin uso); sin hooks de pre-commit | Ruido; el lint depende de que cada uno lo corra | Bajo | `pnpm lint --fix` + husky/lint-staged |
| DT-14 | 🟢 P4 | Proceso | Tablas de cobertura semanal y vocero de `matriz-rotacion.md` vacías | Falta evidencia del seguimiento semanal | Bajo | Completar al cierre de cada semana |

### Resumen por prioridad

| Prioridad | Cantidad | Antes de… |
|---|---|---|
| 🔴 P1 | 3 | Salir a producción |
| 🟠 P2 | 3 | Cerrar el siguiente sprint |
| 🟡 P3 | 5 | Primera versión estable |
| 🟢 P4 | 3 | Cuando haya capacidad |

### Deuda ya pagada (para contexto)

| Deuda | Cómo se resolvió |
|---|---|
| CVE de SQL injection en Drizzle ORM | Migración completa a Prisma (agosto 2026) |
| CVEs en nodemailer, axios, react-router, vite | Bumps de versión — `pnpm audit` en 0 (agosto 2026) |
| Sin CI | Workflow `tests` en cada PR con umbral de cobertura |
| Sin Docker para el stack completo | `docker-compose.yml` con db, mailpit, be y fe |
| Errores 500 por datos inválidos (condición de piel repetida, JSON mal formado, ruta inexistente) | Encontrados por las pruebas y corregidos a 422/400/404 |
| Documentación de arquitectura, BD y API heredada de la plantilla | Reescrita para GroomingSpa (noviembre 2026) |
