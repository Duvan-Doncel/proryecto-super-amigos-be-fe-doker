<!--
  ¿Qué? Plan de pruebas de Super Amigos Grooming Spa.
  ¿Para qué? Dejar por escrito QUÉ se prueba, en QUÉ niveles, CON QUÉ herramientas, en QUÉ
  ambiente y CUÁNDO se da por aprobado — antes de leer los resultados en el informe.
  ¿Impacto? Sin un plan, las pruebas son una lista suelta de archivos; con él, cualquiera
  puede saber qué está cubierto, qué no y por qué.
-->

# 🧪 Plan de pruebas — Super Amigos Grooming Spa

| Campo | Valor |
|---|---|
| Proyecto | Super Amigos Grooming Spa (SAG Spa) — Ficha 3228970 |
| Stack | React + Vite (fe) · Express 5 + TypeScript + Prisma (be) · PostgreSQL 17 |
| Equipo | Santiago Doncel · Álvaro Espejo · Yesid Valencia · Juan Rodríguez |
| Versión del plan | 1.0 — noviembre 2026 |
| Resultados | Ver [`informe-pruebas.md`](informe-pruebas.md) |

---

## 1. Objetivo

Verificar que los flujos de negocio de GroomingSpa (autenticación, mascotas, citas con
semáforo y motor de precios, tarifario, proveedores y perfil) cumplen sus requisitos
funcionales ([`docs/requisitos/RFs/`](../requisitos/RFs/)) y que el API responde con códigos
y formato de error correctos, **sin tocar nunca la base de datos de desarrollo**.

## 2. Alcance

### 2.1 Dentro del alcance

| Módulo | RF | Qué se verifica |
|---|---|---|
| Autenticación | RF-001 a RF-006 | Registro, verificación de email, login, refresh, cambio y recuperación de contraseña |
| Perfil y staff | RF-007, RF-008 | Ver/editar perfil, crear cuenta de staff, listado paginado de clientes |
| Mascotas | RF-012, RF-013 | CRUD de "Mis mascotas", foto, condiciones de piel, conversión entidad → DTO |
| Citas (semáforo 🟢) | RF-009, RF-017 | Agendar, horario 9:00–18:00, "a partir de mañana", tope de 10 citas/día, cambio de estado por staff |
| Motor de precios | RF-014 | Precio base + tamaño + pelo + piel + comportamiento; bloqueo por condición |
| Proveedores | RF-020 | Acceso solo staff, errores sin fuga de SQL/stack trace |
| Seguridad transversal | RNF-001 a RNF-004 | 401 sin token, 403 por rol, 400 JSON mal formado, 404 ruta inexistente |
| Componentes del frontend | — | Button, InputField, Alert, Pagination, ProtectedRoute, LoginForm, RegisterForm, AppointmentPage |

### 2.2 Fuera del alcance (en esta versión)

- Síntomas leves (RF-010/RF-018), emergencias (RF-011), tienda/carrito/pedidos (RF-015,
  RF-016, RF-019), pedidos a proveedor (RF-021) y ventas (RF-022/RF-023): **sin pruebas
  automatizadas todavía** — quedan registrados como deuda técnica.
- Pruebas de carga/rendimiento y pruebas de penetración.
- Compatibilidad entre navegadores (E2E solo en Chromium).

## 3. Niveles y tipos de prueba

| Nivel | Qué prueba | Herramienta | Ubicación |
|---|---|---|---|
| **Unitaria (BE)** | Reglas puras sin HTTP ni BD: horario, fechas límite, tope diario, schemas zod, DTO | Vitest | `be/src/tests/*.rules.test.ts`, `pets.data.test.ts` |
| **Unitaria (FE)** | Componentes y utilidades aislados, API simulada | Vitest + Testing Library + jsdom | `fe/src/__tests__/` |
| **API / contrato** | Endpoints con supertest y Prisma simulado (mock/stub/fake) | Vitest + supertest | `be/src/tests/api/` |
| **Integración con BD** | Endpoints contra PostgreSQL real de pruebas | Vitest + supertest + Prisma | `be/src/tests/*.test.ts`, `pets.integration.api.test.ts` |
| **End-to-end (E2E)** | Flujos completos en el navegador (registro, login inválido, crear cita, estados de "Mis mascotas") | Playwright | `e2e/tests/` |

**Técnicas de diseño de casos**: partición de equivalencia (válido / inválido), **valores
límite** (peso 0, edad 0–100, 9:00 / 18:00, cupo 10, teléfono 6 vs 7 dígitos), tabla de
decisión por rol (sin token / cliente / staff) y dobles de prueba (mock, stub, spy, fake,
MSW, `page.route`).

## 4. Ambiente de pruebas (separado del de desarrollo)

| | Desarrollo | Pruebas locales | CI (GitHub Actions) |
|---|---|---|---|
| Base de datos | `groomingspa_db` | `groomingspa_test` | `groomingspa_test` |
| Puerto | 5433 | **5434** | 5432 (service container) |
| Archivo de variables | `be/.env` | **`be/.env.test`** | `env:` del workflow |
| Cómo se levanta | `docker compose up -d db mailpit` | `docker compose -f docker-compose.test.yml up -d` | `services: postgres` en [`tests.yml`](../../.github/workflows/tests.yml) |
| Persistencia | Volumen `groomingspa_data` | **Sin volumen** (desechable) | Efímera |

- `docker-compose.test.yml` llega a `main` con la rama `test/s6-bd-yesid` (PR de la semana 6).
- `be/src/tests/setup.ts` limpia las tablas antes de cada archivo de prueba, por eso
  **nunca** debe apuntarse a la BD de desarrollo.
- El correo de verificación se captura con **Mailpit** (puerto 1025); ningún correo real sale.
- Los secretos JWT de pruebas son distintos a los de desarrollo.

## 5. Criterios de entrada y salida

**Entrada** (para empezar a probar una rama):
- La rama compila (`tsc --noEmit`) y pasa lint.
- Las migraciones de Prisma aplican sobre una BD de pruebas vacía.

**Salida** (para aprobar un PR hacia `main`):
- 100 % de los casos en verde en el workflow `tests` (frontend + backend).
- Cobertura del backend ≥ umbral configurado en `be/vitest.config.ts`
  (líneas 57 %, sentencias 56 %, funciones 50 %, ramas 46 %).
- Revisión del PR por un integrante que haya trabajado en **otra capa** esa semana
  ([`matriz-rotacion.md`](../matriz-rotacion.md)).
- Ningún defecto de severidad Alta o Crítica abierto sobre el módulo tocado.

## 6. Roles — rotación de capas

Cada semana cada integrante cambia de capa (Front / API / BD / E2E) para que todos pasen por
las cuatro. El detalle semana a semana y el enlace a cada PR está en
[`docs/matriz-rotacion.md`](../matriz-rotacion.md).

## 7. Gestión de defectos

Todo defecto encontrado por una prueba se registra como **Issue de GitHub** con:

| Etiqueta | Valores |
|---|---|
| Severidad | `sev:critica` · `sev:alta` · `sev:media` · `sev:baja` |
| Estado | Abierto → En progreso → Resuelto (PR que lo cierra) → Verificado (test en verde) |
| Capa | `capa:front` · `capa:api` · `capa:bd` · `capa:e2e` |

Cada corrección va acompañada del test que lo reproduce, para que el defecto no regrese.

## 8. Cómo ejecutar

```bash
# Backend — levantar BD de pruebas y correr
docker compose -f docker-compose.test.yml up -d
cd be && pnpm test            # o pnpm test:coverage

# Frontend
cd fe && pnpm test            # o pnpm test:coverage

# E2E (con el stack completo arriba: docker compose up -d --build)
cd e2e && pnpm exec playwright test
```

## 9. Riesgos

| Riesgo | Mitigación |
|---|---|
| Un test apunta por error a la BD de desarrollo y la vacía | `.env.test` con puerto y BD distintos; contenedor de pruebas sin volumen |
| Módulos sin pruebas (tienda, pedidos, ventas, síntomas) | Registrados como deuda técnica, priorizados en el backlog |
| Cobertura del frontend baja (~10 %) | Subir umbral de `fe/vite.config.ts` semana a semana según la matriz |
| Ramas de pruebas sin mergear a `main` | Revisión semanal de PRs abiertos |
