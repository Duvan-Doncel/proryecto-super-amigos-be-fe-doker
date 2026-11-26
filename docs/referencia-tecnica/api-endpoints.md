# API REST — Super Amigos Grooming Spa

<!--
  ¿Qué? Referencia de TODOS los endpoints del backend de GroomingSpa (Express + TypeScript + Prisma).
  ¿Para qué? Servir de contrato entre frontend y backend: ruta, rol, cuerpo, validaciones y respuestas.
  ¿Impacto? Reemplaza la versión heredada de la plantilla ("NN Auth"), que solo documentaba auth y users.
  Fuente de verdad: be/src/app.ts (montaje), be/src/modules/*/*.router.ts (rutas) y *.schema.ts (zod).
-->

## Información general

| Campo | Valor |
|---|---|
| Base URL (desarrollo) | `http://localhost:3000/api/v1` |
| Health check | `GET http://localhost:3000/health` |
| Formato | `application/json` (excepto subida de foto: `multipart/form-data`) |
| Autenticación | `Authorization: Bearer <accessToken>` (JWT, 15 min) + refresh token (7 días) |
| Roles | `client` (dueño de mascota) · `staff` (personal del spa) |
| Rate limiting | 10 peticiones / 15 min por IP en `/api/v1/auth/*` |
| Seguridad | `helmet`, CORS limitado a `FRONTEND_URL`, contraseñas con `bcryptjs`, validación `zod` |

### Formato de respuesta

```jsonc
// Éxito
{ "success": true, "data": { ... } }
// Éxito paginado
{ "success": true, "data": [ ... ], "meta": { "page": 1, "limit": 20, "total": 57, "totalPages": 3 } }
// Error (nunca incluye SQL ni stack trace)
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "El petId debe ser un UUID válido." } }
```

### Códigos de error

| HTTP | `code` | Cuándo |
|---|---|---|
| 400 | `BAD_REQUEST` | JSON mal formado, regla de negocio violada (cita en estado final, cupo lleno, token inválido) |
| 401 | `UNAUTHORIZED` | Sin token, token inválido/expirado, credenciales incorrectas |
| 403 | `FORBIDDEN` | Rol no permitido, recurso de otro usuario, email sin verificar |
| 404 | `NOT_FOUND` | Recurso o ruta inexistente |
| 409 | `CONFLICT` | Email duplicado, stock insuficiente |
| 409 | `PET_CONDITION_BLOCKS_BOOKING` | La mascota tiene una condición (sarna, hongos, agresividad…) que exige revisión antes del baño |
| 422 | `VALIDATION_ERROR` | El cuerpo o la query no cumple el schema `zod` |
| 429 | — | Se superó el rate limit de auth |
| 500 | `INTERNAL_ERROR` | Error no controlado (mensaje genérico) |

**Leyenda de la columna "Acceso"**: 🌐 público · 👤 `client` · 🛠️ `staff` · 🔑 cualquier usuario autenticado.

---

## Resumen de endpoints (60)

| # | Módulo | Prefijo | Endpoints |
|---|---|---|---|
| 1 | Autenticación | `/auth` | 7 |
| 2 | Usuarios (perfil) | `/users` | 2 |
| 3 | Staff (cuentas y clientes) | `/staff` | 2 |
| 4 | Mascotas | `/pets` | 8 |
| 5 | Servicios | `/services` | 6 |
| 6 | Tarifario / motor de precios | `/pricing` | 5 |
| 7 | Citas y agenda | `/appointments`, `/staff/agenda` | 6 |
| 8 | Reportes de síntomas | `/symptom-reports`, `/staff/symptom-reports` | 4 |
| 9 | Información de emergencia | `/emergency-info` | 2 |
| 10 | Productos | `/products` | 5 |
| 11 | Pedidos de clientes | `/orders`, `/staff/orders` | 4 |
| 12 | Proveedores y pedidos a proveedor | `/suppliers`, `/supplier-orders` | 7 |
| 13 | Ventas y reporte | `/sales`, `/staff/sales-report` | 2 |
| — | Health | `/health` (sin prefijo) | 1 |

---

## 1. Autenticación — `/api/v1/auth` (RF-001 a RF-006)

| Método | Ruta | Acceso | Body | Respuestas |
|---|---|---|---|---|
| POST | `/register` | 🌐 | `documentId`, `firstName`, `lastName`, `phone`, `email`, `password` | 201 · 409 email duplicado · 422 |
| POST | `/verify-email` | 🌐 | `token` | 200 · 400 token inexistente/usado/expirado · 422 |
| POST | `/login` | 🌐 | `email`, `password` | 200 `{ accessToken, refreshToken, user }` · 401 · 403 email sin verificar · 422 |
| POST | `/refresh` | 🌐 | `refreshToken` | 200 nuevo `accessToken` · 401 · 422 |
| POST | `/change-password` | 🔑 | `currentPassword`, `newPassword` | 200 · 401 clave actual incorrecta · 422 nueva = actual |
| POST | `/forgot-password` | 🌐 | `email` | 200 **siempre** (no revela si el email existe) · 422 |
| POST | `/reset-password` | 🌐 | `token`, `newPassword` | 200 · 400 token inválido · 422 |

**Validaciones de registro**: documento 4–20 dígitos · nombre/apellido 2–100 letras · teléfono 7–15
dígitos · email ≤ 255 · contraseña ≥ 8 caracteres con mayúscula, minúscula y número (máx. 72).

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"cliente@correo.com","password":"Segura123"}'
```

## 2. Usuarios — `/api/v1/users` (RF-007)

| Método | Ruta | Acceso | Body | Respuestas |
|---|---|---|---|---|
| GET | `/me` | 🔑 | — | 200 perfil (sin contraseña) · 401 |
| PUT | `/me` | 🔑 | `firstName?`, `lastName?`, `phone?` (el email se ignora) | 200 · 401 · 422 |

## 3. Staff — `/api/v1/staff` (RF-008)

| Método | Ruta | Acceso | Body / Query | Respuestas |
|---|---|---|---|---|
| POST | `/` | 🛠️ | `firstName`, `lastName`, `email`, `password` | 201 cuenta staff · 401 · 403 · 409 · 422 |
| GET | `/clients` | 🛠️ | `?q` (≥ 2 car.), `?hasPets=true\|false`, `?page`, `?limit` (≤ 100) | 200 paginado con `petCount` · 403 |

## 4. Mascotas — `/api/v1/pets` (RF-012, RF-013)

| Método | Ruta | Acceso | Body / Query | Respuestas |
|---|---|---|---|---|
| GET | `/me` | 👤 | — | 200 lista (vacía = `[]`) · 401 · 403 |
| POST | `/me` | 👤 | campos de mascota (abajo); el dueño sale del token | 201 · 422 |
| PUT | `/me/:id` | 👤 | campos de mascota (todos opcionales) | 200 · 403 mascota ajena · 404 · 422 |
| DELETE | `/me/:id` | 👤 | — | 204 (borra también sus condiciones de piel) · 403 · 404 |
| GET | `/` | 🛠️ | `?clientId=<uuid>` | 200 mascotas del cliente · 422 |
| POST | `/` | 🛠️ | `clientId` + campos de mascota | 201 · 422 |
| PUT | `/:id` | 🛠️ | campos de mascota | 200 · 404 · 422 |
| POST | `/:id/photo` | 🔑 (dueño o staff) | `multipart/form-data`, campo `photo` (solo imágenes) | 200 con `photoUrl` · 403 · 422 no es imagen |

**Campos de mascota**: `name` (1–100) · `species` (`canina` \| `felina`) · `breed?` · `gender?` ·
`age?` (0–100) · `weight?` (> 0 y ≤ 999,99) · `color?` · `size?` (`pequeno` \| `mediano` \| `grande` \|
`gigante`) · `coatType?` (`corto` \| `largo`) · `behavior?` (`tranquilo` \| `nervioso` \| `agresivo`) ·
`skinConditions?` (`[{ type, note? }]`, sin tipos repetidos) · `pathology?` (por defecto "No aplica").

Tipos de condición de piel: `pulgas`, `garrapatas`, `piel_irritada`, `alergia`, `piel_sensible`,
`nudos`, `hongos`, `sarna`, `heridas`, `infeccion`.

## 5. Servicios — `/api/v1/services` (RF-014)

| Método | Ruta | Acceso | Body | Respuestas |
|---|---|---|---|---|
| GET | `/` | 🌐 | — | 200 servicios activos |
| GET | `/staff` | 🛠️ | — | 200 todos (incluye inactivos) |
| POST | `/` | 🛠️ | `name`, `description?`, `price` (> 0), `durationMinutes` (> 0) | 201 · 422 |
| PUT | `/:id` | 🛠️ | mismos campos opcionales + `active?` | 200 · 404 · 422 |
| PUT | `/:id/modifiers` | 🛠️ | `sizeModifiers[] { species, size, amount }`, `coatModifiers[] { species, coatType, amount }` | 200 · 422 |
| DELETE | `/:id` | 🛠️ | — | 200/204 · 404 |

## 6. Tarifario — `/api/v1/pricing` (RF-014)

| Método | Ruta | Acceso | Body | Respuestas |
|---|---|---|---|---|
| GET | `/public` | 🌐 | — | 200 tarifario público (8 tramos: 4 perro + 4 gato) |
| GET | `/config` | 🛠️ | — | 200 configuración completa del motor |
| PUT | `/size-tiers` | 🛠️ | `tiers[8] { species, size, label, maxWeight }` | 200 · 422 |
| PUT | `/skin-rules` | 🛠️ | `rules[10] { type, label, amount, blocksBooking }` | 200 · 422 |
| PUT | `/behavior-rules` | 🛠️ | `rules[3] { behavior, label, amount, blocksBooking }` | 200 · 403 cliente · 422 |

**Fórmula del precio**: precio base del servicio + recargo por tamaño (según especie) + recargo
por tipo de pelo + recargo por cada condición de piel + recargo por comportamiento. Si alguna regla
tiene `blocksBooking = true`, la cita no se puede agendar.

## 7. Citas — `/api/v1/appointments` y `/api/v1/staff/agenda` (RF-009, RF-017) 🟢

| Método | Ruta | Acceso | Body / Query | Respuestas |
|---|---|---|---|---|
| POST | `/appointments/quote` | 👤 | `petId`, `serviceId` | 200 `{ total, breakdown, blocked }` |
| POST | `/appointments` | 👤 | `petId`, `serviceId`, `date` (AAAA-MM-DD), `time` (HH:mm), `notes?` (≤ 500) | 201 con `totalPrice` y `priceBreakdown` congelados · 400 fuera de horario / antes de mañana / cupo lleno · 409 `PET_CONDITION_BLOCKS_BOOKING` · 422 |
| GET | `/appointments/me` | 👤 | — | 200 citas del cliente con mascota y servicio |
| GET | `/appointments/availability` | 👤 | `?from=AAAA-MM-DD&to=AAAA-MM-DD` | 200 capacidad y cupos ocupados por día · 403 staff |
| PUT | `/appointments/:id` | 🛠️ | `status`: `confirmed` \| `completed` \| `cancelled` | 200 · 400 ya en estado final · 403 cliente · 404 · 422 |
| GET | `/staff/agenda` | 🛠️ | `?date=AAAA-MM-DD` (por defecto hoy) | 200 citas del día |

**Reglas de negocio**: horario 9:00–18:00 (RN-093) · solo a partir de mañana (RN-092) · máximo
**10 citas por día** (las canceladas liberan cupo).

```bash
curl -X POST http://localhost:3000/api/v1/appointments \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"petId":"<uuid>","serviceId":"<uuid>","date":"2026-12-02","time":"10:30"}'
```

## 8. Reportes de síntomas — `/api/v1/symptom-reports` (RF-010, RF-018) 🟡

| Método | Ruta | Acceso | Body | Respuestas |
|---|---|---|---|---|
| POST | `/symptom-reports` | 👤 | `petId`, `symptom` (3–500), `daysWithSymptom` (≥ 1), `notes?` | 201 · 403 mascota ajena · 422 |
| GET | `/symptom-reports/me` | 👤 | — | 200 reportes del cliente con su recomendación |
| GET | `/staff/symptom-reports` | 🛠️ | — | 200 reportes pendientes |
| PUT | `/staff/symptom-reports/:id` | 🛠️ | `recommendation` (1–1000) | 200 revisado · 400 ya revisado · 404 · 422 |

> La auxiliar **no diagnostica ni receta**: solo da una recomendación (p. ej. "acudir al veterinario").

## 9. Emergencia — `/api/v1/emergency-info` (RF-011) 🔴

| Método | Ruta | Acceso | Body | Respuestas |
|---|---|---|---|---|
| GET | `/` | 🌐 | — | 200 `{ searchQuery, emergencyPhones[] }` (para el mapa de veterinarias cercanas) |
| PUT | `/` | 🛠️ | `searchQuery` (3–200), `emergencyPhones[] { label, phone }` (≥ 1) | 200 · 422 |

## 10. Productos — `/api/v1/products` (RF-015)

| Método | Ruta | Acceso | Body / Query | Respuestas |
|---|---|---|---|---|
| GET | `/` | 🌐 | `?page`, `?limit` (≤ 100), `?category`, `?search` | 200 paginado (solo activos) |
| GET | `/staff` | 🛠️ | igual + `?active=true\|false`, `?lowStock=true` | 200 paginado |
| POST | `/` | 🛠️ | `name` (2–150), `description?`, `price` (> 0), `stock` (≥ 0), `category?` | 201 · 422 |
| PUT | `/:id` | 🛠️ | mismos campos opcionales + `active?` | 200 · 404 · 422 |
| DELETE | `/:id` | 🛠️ | — | 200/204 · 404 |

## 11. Pedidos de clientes — `/api/v1/orders` (RF-016, RF-019)

| Método | Ruta | Acceso | Body | Respuestas |
|---|---|---|---|---|
| POST | `/orders` | 👤 | `items[] { productId, quantity (> 0) }` (≥ 1) | 201 · 404 producto · 409 stock insuficiente · 422 |
| GET | `/orders/me` | 👤 | — | 200 pedidos del cliente |
| GET | `/staff/orders` | 🛠️ | — | 200 pedidos pendientes |
| PUT | `/staff/orders/:id` | 🛠️ | `status`: `completed` \| `cancelled` | 200 · 400 · 404 · 422 |

## 12. Proveedores — `/api/v1/suppliers` y `/api/v1/supplier-orders` (RF-020, RF-021)

Todo el módulo exige rol 🛠️ staff (401 sin token, 403 cliente).

| Método | Ruta | Body | Respuestas |
|---|---|---|---|
| GET | `/suppliers` | — | 200 lista |
| POST | `/suppliers` | `name` (2–150), `contactName?`, `phone?`, `email?`, `address?` | 201 · 422 |
| PUT | `/suppliers/:id` | mismos opcionales + `active?` | 200 · 404 · 422 |
| DELETE | `/suppliers/:id` | — | 200/204 · 404 |
| GET | `/supplier-orders` | — | 200 lista con ítems |
| POST | `/supplier-orders` | `supplierId`, `expectedDate?`, `items[] { productId, quantity, unitCost }` | 201 · 404 · 422 |
| PUT | `/supplier-orders/:id` | `status: "received"`, `receivedDate?` → **suma el stock** de los productos | 200 · 400 ya recibido · 404 · 422 |

## 13. Ventas — `/api/v1/sales` y `/api/v1/staff/sales-report` (RF-022, RF-023)

| Método | Ruta | Acceso | Body / Query | Respuestas |
|---|---|---|---|---|
| POST | `/sales` | 🛠️ | `items[] { productId, quantity }`, `clientId?` **o** `clientName?` (no ambos) | 201 · descuenta stock · 409 stock insuficiente · 422 |
| GET | `/staff/sales-report` | 🛠️ | `?from=AAAA-MM-DD&to=AAAA-MM-DD` | 200 totales por período · 422 |

---

## Health check

| Método | Ruta | Acceso | Respuesta |
|---|---|---|---|
| GET | `/health` | 🌐 | 200 `{ status: "ok", timestamp }` — usado por Docker y `scripts/start.sh` |
