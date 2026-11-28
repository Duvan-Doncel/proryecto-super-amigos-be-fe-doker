<!--
  ¿Qué? Informe de pruebas automatizadas de Super Amigos Grooming Spa.
  ¿Para qué? Mostrar con evidencia cuántos casos distintos existen, qué verifica cada uno,
  el resultado de la última ejecución y los defectos que las pruebas encontraron.
  ¿Impacto? Es la evidencia de los criterios "≥ 20 casos de prueba unitaria automatizada"
  y "reporte de ejecución" — el plan está en plan-de-pruebas.md.
-->

# 📊 Informe de pruebas automatizadas — Super Amigos Grooming Spa

| Campo | Valor |
|---|---|
| Plan de referencia | [`plan-de-pruebas.md`](plan-de-pruebas.md) |
| Commit evaluado | `96fe2af` (`main`, 10-nov-2026 — merge PR #23) |
| Ejecución CI | [GitHub Actions · workflow `tests` · run 42960273905](https://github.com/Duvan-Doncel/proryecto-super-amigos-be-fe-doker/actions/runs/42960273905) — ✅ **success** |
| Ejecución local frontend | 25-nov-2026 — 10 archivos, **59/59 en verde** |

---

## 1. Resumen

| Capa | Archivos | Casos distintos declarados¹ | Resultado |
|---|---|---|---|
| Backend — unitarias (reglas, schemas, DTO) | 3 | 17 | ✅ |
| Backend — API / contrato (supertest + Prisma simulado) | 3 | 22 | ✅ |
| Backend — integración con BD real de pruebas | 6 | 74 | ✅ |
| Frontend — componentes, páginas y utilidades | 10 | 51 (59 ejecuciones) | ✅ |
| E2E — Playwright | 4 | 6 | Manual / local |
| **Total** | **26** | **170** | |

¹ Un `it(...)` o un bloque `it.each(...)` cuenta como un caso distinto. Un `it.each` se
ejecuta varias veces con distintos valores límite (por eso el frontend declara 51 casos y
ejecuta 59).

**Conclusión**: el proyecto supera holgadamente el mínimo de **20 casos distintos de prueba
unitaria automatizada** — solo las unitarias puras del backend (17) más las del frontend (51)
suman 68.

### 1.1 Casos agregados después del commit evaluado (27-nov-2026)

| PR | Archivo | Casos | Qué verifica |
|---|---|---|---|
| #24 | `api/appointments.repo.test.ts` | 4 | Repositorio de citas con dobles (mock, stub, fake): hora fuera de horario, día sin cupos, mascota bloqueada y cita válida |
| #25 | `pets.contrato-front.test.ts` | 5 | Contrato real de `/pets/me` contra los handlers MSW del frontend (BD real de pruebas) |
| #25 | `api/ids.test.ts` | 3 | `isUuid` en su valor límite (35, 36 y 37 caracteres) |
| #35 | `clients-deactivation.test.ts` | 12 | Dar de baja y reactivar: conserva el historial, cancela citas y pedidos, devuelve el stock, bloquea login (403) y refresh (401), 404/409/422 |
| #35 | `limits.test.ts` | 5 | Topes de dinero, cantidad, líneas, página y motivo con caracteres peligrosos → 422 |
| #35 | `dates.test.ts` | 8 (20 ejecuciones) | Fechas que no existen (`2026-02-30`), años fuera de 2020–2100, rangos al revés o demasiado largos → 422 |
| #35 | `users.test.ts` | +1 | Buscar "Alvaro Espejo": cada palabra filtra más |
| #34 | `AppointmentPage.test.tsx` | +2 | Preselecciona la mascota que llega por `?mascota=` e ignora un id ajeno |
| | **Total agregado** | **40** | **170 + 40 = 210 casos distintos** |

## 2. Cobertura

| Capa | Líneas | Sentencias | Funciones | Ramas | Umbral |
|---|---|---|---|---|---|
| Backend | ≥ 57 % | ≥ 56 % | ≥ 50 % | ≥ 46 % | `be/vitest.config.ts` — el CI falla si baja |
| Frontend | 10,5 % | 10,2 % | 7,1 % | 11,0 % | `fe/vite.config.ts` (1 % — **debe subir**) |

## 3. Detalle de casos por archivo

### 3.1 Backend — pruebas unitarias (sin HTTP ni BD)

| Archivo | Casos | Qué verifica |
|---|---|---|
| `appointments.rules.test.ts` | 5 | RN-093 horario 9:00–18:00 (límites), RN-092 "a partir de mañana" (incluye cambio de mes), tope de 10 citas/día |
| `pets.data.test.ts` | 10 | Schema de mascota: peso 0 y > 999,99, edad 0–100, nombre vacío/espacios, especie fuera de lista, patología por defecto; DTO: Decimal → número, peso null, condiciones de piel ordenadas |
| `pets.rules.test.ts` | 2 | Condición de piel repetida → 422 (límite: dos iguales) y tipos distintos aceptados |

### 3.2 Backend — API / contrato (Prisma simulado)

| Archivo | Casos | Qué verifica |
|---|---|---|
| `api/appointments.api.test.ts` | 8 | `GET /appointments/me` 200; `PUT /appointments/:id` 200, 404, 422 estado no permitido, 400 estado final; `POST` 422 petId no UUID; 401 sin token; 403 cliente cambiando estado |
| `api/pets.front.api.test.ts` | 6 | Contrato exacto que consume "Mis mascotas": 200 con campos del frontend, lista vacía `[]` (no `null`), 401/403 con formato de error, 201 al crear, 422 con mensaje legible |
| `api/security-errors.api.test.ts` | 8 | Proveedores: 401 sin token / token inválido, 403 cliente, 200 staff, 500 **sin SQL ni stack trace**; JSON mal formado 400, tipo incorrecto 422, ruta inexistente 404 en JSON |

### 3.3 Backend — integración contra PostgreSQL de pruebas

| Archivo | Casos | Qué verifica |
|---|---|---|
| `auth.test.ts` | 38 | Registro (409 duplicado, 422 email/clave/documento/nombre/teléfono/body vacío), login (403 sin verificar, 401 clave/email), refresh, cambio de clave, forgot/reset (sin revelar si el email existe), verificación de email (token usado/expirado), `GET /users/me`, creación de staff por rol |
| `pricing.test.ts` | 10 | Motor de precios: base, suma de modificadores, recargo por especie (gato ≠ perro), bloqueo por agresividad/hongos/sarna (409), precio congelado en la cita, tarifario público (8 tramos) y edición solo staff |
| `pets.test.ts` | 9 | CRUD de mascota propia, `clientId` sale del token (ignora el body), 403 a staff y a mascota ajena, subida de foto y rechazo de no-imagen |
| `users.test.ts` | 9 | Perfil sin contraseña, edición, teléfono inválido, email no editable, listado paginado de clientes con `?q=` y 403 a no-staff |
| `appointment-availability.test.ts` | 4 | Tope diario (rechaza la cita 11 con 400), canceladas no cuentan, endpoint de disponibilidad, 403 para staff |
| `pets.integration.api.test.ts` | 4 | La fila queda en la BD con el dueño del token, 403 sin modificar fila ajena, `ON DELETE CASCADE` de condiciones de piel, 422 (no 500) por condición repetida |

### 3.4 Frontend (Vitest + Testing Library)

| Archivo | Casos | Qué verifica |
|---|---|---|
| `components/Button.test.tsx` | 6 | Texto, estado "Cargando...", disabled, onClick (y que NO se invoque si está deshabilitado/cargando) |
| `components/InputField.test.tsx` | 9 | label↔input, `aria-invalid`, `aria-describedby`, mostrar/ocultar contraseña |
| `components/Alert.test.tsx` | 3 | Mensaje y `role="alert"` accesible |
| `components/Pagination.test.tsx` | 9 | Resumen "X–Y de N", `aria-current`, anterior/siguiente en extremos, hook `usePagination` |
| `components/ProtectedRoute.test.tsx` | 4 | Loading, redirección a `/login`, contenido autenticado, cliente redirigido desde ruta de staff |
| `components/LoginForm.test.tsx` | 4 | Envío correcto, error de credenciales, botón bloqueado al cargar, error se limpia al escribir |
| `components/RegisterForm.test.tsx` | 5 | Botón bloqueado sin aceptar términos, teléfono solo dígitos, 6 dígitos rechazado, "Revisa tu correo", error del servidor |
| `pages/AppointmentPage.test.tsx` | 4 | Lista de citas, estado vacío, precio estimado, bloqueo por revisión previa |
| `utils/petForm.test.ts` | 2 | Omite opcionales vacíos, convierte edad/peso a número |
| `utils/tablePaging.test.ts` | 1 | Numeración de filas (límite: primera fila = 1) |

### 3.5 End-to-end (Playwright)

| Archivo | Casos | Flujo |
|---|---|---|
| `registro.spec.js` | 1 | Persona nueva crea cuenta y ve el aviso de verificar correo (Yesid) |
| `login-invalido.spec.js` | 1 | Contraseña incorrecta muestra error y no sale de `/login` (Álvaro) |
| `crear-cita.spec.js` | 1 | Clienta agenda cita y la ve en "Mis citas" (Santiago) |
| `mascotas-estados.spec.js` | 3 | Estado vacío, API caída y error de validación con `page.route` (Álvaro) |

## 4. Defectos encontrados por las pruebas

Las pruebas no solo confirmaron lo que funcionaba: **encontraron errores reales** que se
corrigieron en el mismo PR junto al test que los reproduce.

| ID | Defecto | Severidad | Encontrado por | Estado |
|---|---|---|---|---|
| DEF-01 | Condición de piel repetida en una mascota respondía **500** (violación `UNIQUE(pet_id, type)`) en vez de 422 | Media | Álvaro — S6 API contra BD real | ✅ Resuelto (PR #23) |
| DEF-02 | Carácter nulo (`\u0000`) en datos de proveedor respondía **500** en vez de 422 | Media | Yesid — S6 BD | 🔄 Corregido en rama `test/s6-bd-yesid`, pendiente de merge |
| DEF-03 | JSON mal formado devolvía HTML de Express en vez de **400** JSON | Baja | Yesid — S4 seguridad | ✅ Resuelto (PR #17) |
| DEF-04 | Ruta inexistente devolvía HTML en vez de **404** JSON | Baja | Yesid — S4 seguridad | ✅ Resuelto (PR #17) |
| DEF-05 | `id` que no es UUID en la URL respondía **500** en vez de 404 | Media | Santiago — S6 Front (MSW vs contrato real) | ✅ Resuelto (PR #25, Issue #32 cerrado) |
| DEF-06 | Validación de nombre de mascota vacío devolvía mensaje técnico, no legible para el formulario | Baja | Álvaro — S4 Front | ✅ Resuelto (PR #16) |

> Estos defectos se registran como Issues de GitHub con etiquetas de severidad y estado
> (ver plan, §7).

## 5. Pendientes y recomendaciones

1. **Módulos sin pruebas**: síntomas, emergencias, tienda/carrito/pedidos, pedidos a
   proveedor y ventas.
2. **Cobertura del frontend (10,5 %)**: subir el umbral de `fe/vite.config.ts` y probar las
   páginas de staff.
3. **Mergear las ramas de pruebas abiertas** (`test/s6-bd-yesid` y las de Juan) para que sus
   casos y correcciones lleguen a `main`. `test/s6-front-santiago` ya se mergeó (PR #25).
4. Ejecutar E2E en el CI (hoy se corren manualmente).
