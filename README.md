<!--
  ¿Qué? Documentación principal del proyecto Super Amigos Grooming Spa.
  ¿Para qué? Guiar a cualquier persona (compañero de equipo, instructor, o quien
  clone este repo en otro computador) a entender, configurar y ejecutar el proyecto.
  ¿Impacto? Sin este README, nadie más sabría cómo levantar el proyecto ni entendería
  su propósito, arquitectura o convenciones.
-->

# 🐾 Super Amigos Grooming Spa

> **Proyecto educativo** — SENA | 2026

Aplicación web completa para **Super Amigos Grooming Spa**, una micro-empresa de peluquería y
spa para mascotas (perros, gatos, y otras especies domésticas) que también vende productos
(juguetes, accesorios, medicamentos). **No es una clínica veterinaria** — el negocio ofrece
grooming, un sistema de "semáforo" para agendar citas o reportar síntomas leves (revisados por
una auxiliar en veterinaria, sin diagnóstico ni tratamiento), información de emergencia, y una
tienda con pedidos y ventas de mostrador.

Construido sobre una plantilla base de **Express.js + TypeScript** (backend) y
**React + Vite + TypeScript** (frontend), documentado de punta a punta: requisitos funcionales,
historias de usuario, no funcionales y restricciones en [`docs/requisitos/`](docs/requisitos/).

---

## 📝 Antes de empezar

Este repo **no es solo para clonar y cambiar el look**. Antes de presentarlo como evidencia de
aprendizaje, completa la [**Bitácora obligatoria**](BITACORA.md) — es un checklist secuencial
que verifica, con commits de tu propio repo, que entendiste el flujo real (arquitectura, auth,
base de datos) y no solo la apariencia.

---

## 📋 Tabla de Contenidos

- [🛠️ Stack Tecnológico](#️-stack-tecnológico)
- [✅ Prerrequisitos](#-prerrequisitos)
- [🚀 Instalación y Setup](#-instalación-y-setup)
- [🐳 Levantar todo con Docker (recomendado para compartir)](#-levantar-todo-con-docker-recomendado-para-compartir)
- [▶️ Ejecución](#️-ejecución)
- [🧪 Testing](#-testing)
- [📁 Estructura del Proyecto](#-estructura-del-proyecto)
- [📏 Convenciones](#-convenciones)
- [📚 Documentación Adicional](#-documentación-adicional)
- [⚠️ Exención de Responsabilidades](#️-exención-de-responsabilidades)
- [📄 Licencia](#-licencia)

---

## 🛠️ Stack Tecnológico

### Backend (`be/`)

| Tecnología           | Versión  | Rol                                    |
| --------------------- | -------- | --------------------------------------- |
| **Node.js**            | 20 LTS+  | Runtime principal del backend           |
| **Express.js**         | 5.2.1    | Framework web HTTP                      |
| **TypeScript**         | 5.9.3    | Tipado estático — obligatorio           |
| **PostgreSQL**         | 17+      | Base de datos relacional                |
| **Prisma ORM**         | 7.9.1    | ORM type-safe con migraciones declarativas |
| **jsonwebtoken**       | 9.0.3    | Creación y verificación de tokens JWT   |
| **bcryptjs**           | 2.4.3    | Hashing seguro de contraseñas           |
| **zod**                | 3.25.76  | Validación de schemas y request body    |
| **nodemailer**         | 9.0.5    | Envío de emails (verificación, recuperación de clave) |
| **helmet**             | 8.1.0    | Headers de seguridad HTTP               |
| **cors**               | 2.8.6    | Middleware CORS                         |
| **express-rate-limit** | 7.5.1    | Rate limiting en endpoints de auth      |
| **vitest**             | 4.1.2    | Framework de testing                    |
| **supertest**          | 7.2.2    | Tests HTTP de integración               |

### Frontend (`fe/`)

| Tecnología                 | Versión | Rol                                         |
| --------------------------- | ------- | -------------------------------------------- |
| **React**                   | 19.2.4  | Biblioteca para interfaces de usuario        |
| **Vite**                    | 8.2.1   | Bundler y dev server ultrarrápido            |
| **TypeScript**              | 5.9.3   | Superset tipado — obligatorio                |
| **TailwindCSS**             | 4.2.2   | Framework CSS utility-first                  |
| **React Router**            | 7.18.2  | Enrutamiento del lado del cliente            |
| **Axios**                   | 1.19.0  | Cliente HTTP para comunicación con la API    |
| **lucide-react**            | 1.7.0   | Iconos SVG como componentes React            |
| **Vitest**                  | 4.1.2   | Test runner compatible con Vite              |

### Infraestructura

| Herramienta        | Rol                                                          |
| ------------------- | -------------------------------------------------------------- |
| **Docker Compose**  | Levanta PostgreSQL 17, Mailpit, backend y frontend — stack completo |
| **Mailpit**         | Captura SMTP local — UI en `http://localhost:8025`             |

---

## ✅ Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

| Herramienta        | Versión mínima | Verificar con            |
| ------------------- | -------------- | -------------------------- |
| **Docker**          | 24+            | `docker --version`         |
| **Docker Compose**  | 2.20+          | `docker compose version`   |
| **Git**             | 2.40+          | `git --version`            |

Si vas a trabajar en el código (no solo a probarlo), también necesitas:

| Herramienta        | Versión mínima | Verificar con            |
| ------------------- | -------------- | -------------------------- |
| **Node.js**         | 20 LTS+        | `node --version`           |
| **pnpm**            | 9+             | `pnpm --version`           |

> ⚠️ **Importante**: Usar **pnpm** como gestor de paquetes de Node.js.
> **Nunca usar npm ni yarn** en este proyecto (excepto para instalar pnpm la primera vez).

```bash
npm install -g pnpm
pnpm --version
```

> 🖥️ **Usuarios de Windows**: usa **Git Bash** (viene con
> [Git para Windows](https://git-scm.com/download/win)) para los comandos de este README.

---

## 🐳 Levantar todo con Docker (recomendado para compartir)

Esta es la forma más simple de correr el proyecto completo en **otro computador** — no
necesitas instalar Node.js, pnpm, ni PostgreSQL localmente, solo Docker.

```bash
# 1. Clona el repositorio
git clone <URL-de-este-repositorio>
cd <nombre-de-la-carpeta-clonada>/plantilla-profesor

# 2. Copia las variables de entorno de ejemplo
cp be/.env.example be/.env
cp fe/.env.example fe/.env

# 3. Levanta TODO el stack (base de datos, Mailpit, backend y frontend)
docker compose up -d --build

# 4. Verifica que todo esté corriendo
docker compose ps
```

Cuando todos los contenedores estén arriba (puede tardar un par de minutos la primera vez,
mientras construye las imágenes):

- **App**: http://localhost:5173
- **API**: http://localhost:3000/api/v1 (health check en `/health`)
- **Mailpit** (correos de prueba — verificación de cuenta, recuperación de clave): http://localhost:8025

> ⚠️ Los valores por defecto de `be/.env.example` son solo para desarrollo local — nunca los
> uses en un entorno con datos reales de usuarios sin cambiar los secretos JWT y las
> credenciales de base de datos.

Para detener todo:

```bash
docker compose down
```

---

## 🚀 Instalación y Setup (desarrollo sin Docker para `be`/`fe`)

Esta opción es para cuando estás **programando activamente** y quieres recarga en caliente
(hot reload) en el backend y el frontend, en vez de reconstruir imágenes de Docker cada vez.

### 1. Clonar el repositorio

```bash
git clone <URL-de-este-repositorio>
cd <nombre-de-la-carpeta-clonada>/plantilla-profesor
```

### 2. Levantar solo la base de datos y el correo de prueba

```bash
docker compose up -d db mailpit

# Verificar que están corriendo (deberías ver ambos "healthy")
docker compose ps
```

### 3. Configurar el Backend

```bash
cd be
pnpm install
cp .env.example .env
```

`be/.env` (los valores por defecto ya funcionan con el `docker compose up -d db mailpit` de arriba):

```bash
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://groomingspa_user:groomingspa_password@localhost:5433/groomingspa_db
JWT_ACCESS_SECRET=<genera-un-secreto-aleatorio-de-al-menos-32-caracteres>
JWT_REFRESH_SECRET=<genera-otro-secreto-distinto-de-al-menos-32-caracteres>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_FROM=noreply@groomingspa.com
FRONTEND_URL=http://localhost:5173
```

Generar el cliente de Prisma y aplicar las migraciones:

```bash
pnpm db:generate
pnpm db:migrate
```

### 4. Configurar el Frontend

```bash
cd ../fe
pnpm install
cp .env.example .env
```

`fe/.env`:

```bash
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_MAPS_API_KEY=<tu-clave-de-google-maps-si-la-tienes>
```

---

## ▶️ Ejecución

```bash
# Terminal 1 — Base de datos y correo (si no están corriendo)
docker compose up -d db mailpit

# Terminal 2 — Backend
cd be && pnpm dev
# → API en http://localhost:3000

# Terminal 3 — Frontend
cd fe && pnpm dev
# → App en http://localhost:5173
```

---

## 🧪 Testing

📄 **Documentos**: [Plan de pruebas](docs/pruebas/plan-de-pruebas.md) (alcance, niveles,
ambiente, criterios) · [Informe de pruebas](docs/pruebas/informe-pruebas.md) (casos,
resultados, cobertura, defectos) · [Matriz de rotación](docs/matriz-rotacion.md) (quién probó
qué capa cada semana).

### Estado actual

| Capa | Herramienta | Archivos | Casos distintos |
|---|---|---|---|
| Backend — unitarias (reglas, schemas, DTO) | Vitest | 3 | 17 |
| Backend — API / contrato (Prisma simulado) | Vitest + supertest | 3 | 22 |
| Backend — integración con BD de pruebas | Vitest + supertest + PostgreSQL | 6 | 74 |
| Frontend — componentes, páginas, utilidades | Vitest + Testing Library | 10 | 51 |
| End-to-end | Playwright | 4 | 6 |
| **Total** | | **26** | **170** |

Módulos cubiertos: autenticación, perfil/staff, mascotas, citas (horario, tope diario,
disponibilidad), motor de precios y tarifario, proveedores y contrato de errores del API.
**Sin pruebas todavía**: síntomas, emergencias, tienda/pedidos, pedidos a proveedor y ventas.

El workflow [`tests`](.github/workflows/tests.yml) corre backend (con PostgreSQL 17 como
servicio) y frontend con cobertura en **cada PR y cada push a `main`**. El backend falla si
la cobertura baja de 57 % líneas / 46 % ramas (`be/vitest.config.ts`).

### Ambiente de pruebas separado

Los tests del backend **vacían las tablas** antes de cada archivo, por eso corren contra una
base de datos propia que nunca es la de desarrollo:

| | Desarrollo | Pruebas |
|---|---|---|
| Base de datos | `groomingspa_db` (puerto 5433) | `groomingspa_test` (puerto 5434, sin volumen) |
| Variables | `be/.env` | `be/.env.test` |

### Backend

```bash
docker compose -f docker-compose.test.yml up -d   # BD de pruebas desechable
cd be
pnpm test               # Ejecutar todos los tests
pnpm test:coverage      # Con reporte de cobertura
```

### Frontend

```bash
cd fe
pnpm test               # Ejecutar todos los tests
pnpm test:coverage      # Con reporte de cobertura
```

### End-to-end

```bash
docker compose up -d --build      # stack completo
cd e2e && pnpm install
pnpm exec playwright test
```

### Linting y tipos

```bash
# Backend
cd be && pnpm lint && node_modules/.bin/tsc --noEmit

# Frontend
cd fe && pnpm lint && node_modules/.bin/tsc -b --noEmit
```

---

## 📁 Estructura del Proyecto

```
plantilla-profesor/
├── docker-compose.yml            # Stack completo: db + mailpit + be + fe
├── docs/
│   └── requisitos/                # RFs, HUs, RNFs y restricciones de GroomingSpa
│       ├── RFs/                   # 23 Requisitos Funcionales (RF-001 a RF-023)
│       ├── HUs/                   # Historias de Usuario correspondientes
│       ├── RNFs/                  # Requisitos No Funcionales
│       └── restricciones.md
│
├── be/                            # Backend — Express.js + TypeScript
│   ├── .env.example / .env.test   # Plantillas de variables de entorno
│   ├── Dockerfile
│   ├── prisma/
│   │   ├── schema.prisma          # 22 modelos, 11 enums
│   │   └── migrations/
│   └── src/
│       ├── app.ts                 # Registro de todos los routers
│       ├── modules/                # auth, users, staff, pets, services,
│       │                          #   appointments, symptom-reports, emergency-info,
│       │                          #   products, orders, suppliers, supplier-orders, sales
│       ├── middlewares/            # authenticate, requireRole, validate, error
│       └── tests/                  # Setup + tests de auth
│
└── fe/                             # Frontend — React + Vite + TypeScript
    ├── .env.example
    ├── Dockerfile / nginx.conf
    ├── public/galeria/              # Fotos reales de mascotas atendidas (landing page)
    └── src/
        ├── pages/
        │   ├── client/               # Semáforo (cita, síntoma, emergencia), tienda
        │   └── staff/                # Agenda, mascotas, servicios, productos, pedidos,
        │                            #   proveedores, ventas, cuentas de staff
        ├── api/ · types/             # Un módulo por dominio, calcado del backend
        ├── components/ui/            # Button, InputField, SelectField, Alert, StatusBadge...
        └── context/AuthContext.tsx   # Sesión + refresh de token automático
```

---

## 📏 Convenciones

| Aspecto                | Regla                                                          |
| ----------------------- | ---------------------------------------------------------------- |
| Nomenclatura técnica    | Inglés (variables, funciones, clases, endpoints, columnas BD)   |
| Comentarios/docs        | Español (con ¿Qué? ¿Para qué? ¿Impacto?)                       |
| TypeScript              | `strict: true` + ESLint en BE y FE                              |
| Gestor de paquetes      | `pnpm` exclusivamente — `npm` y `yarn` prohibidos               |

---

## 📚 Documentación Adicional

| Documento                                                              | Descripción                                               |
| ------------------------------------------------------------------------ | ------------------------------------------------------------- |
### Análisis y diseño de GroomingSpa

| Documento | Contenido |
|---|---|
| [`docs/requisitos/`](docs/requisitos/) | 23 RFs, 23 HUs, RNFs y restricciones |
| [`docs/referencia-tecnica/architecture.md`](docs/referencia-tecnica/architecture.md) | **Diagramas de arquitectura**: contexto, contenedores (Docker), capas del backend, frontend, secuencia "agendar cita", CI y decisiones técnicas |
| [`docs/referencia-tecnica/database-schema.md`](docs/referencia-tecnica/database-schema.md) | **MER** (22 entidades), **MR** con PK/FK, normalización, enums y reglas de borrado |
| [`docs/referencia-tecnica/uml.md`](docs/referencia-tecnica/uml.md) | **Casos de uso** (22) con especificación, **diagramas de clases** (dominio y backend) y **diagramas de estado** |
| [`docs/referencia-tecnica/api-endpoints.md`](docs/referencia-tecnica/api-endpoints.md) | **API REST completa**: 60 endpoints de los 14 módulos, roles, cuerpos, validaciones y códigos de error |
| [`docs/pruebas/`](docs/pruebas/) | Plan de pruebas e informe de pruebas |

### Otros

| Documento | Descripción |
|---|---|
| [`BITACORA.md`](BITACORA.md) | Checklist obligatorio de aprendizaje, fase por fase |
| [`docs/setup/con-docker.md`](docs/setup/con-docker.md) · [`sin-docker.md`](docs/setup/sin-docker.md) | Setup con Docker o con PostgreSQL y Node.js nativos |
| [`docs/conceptos/`](docs/conceptos/) | Conceptos generales de la plantilla base (OWASP, accesibilidad, patrones) |
| [`be/README.md`](be/README.md) / [`fe/README.md`](fe/README.md) | Guía pedagógica de la plantilla base (módulo de autenticación) |

> Los diagramas están en **Mermaid**: GitHub los dibuja automáticamente al abrir cada archivo.

---

## ⚠️ Exención de Responsabilidades

Este proyecto es de naturaleza **exclusivamente educativa**, desarrollado como ejercicio
formativo en el marco del SENA, sobre una plantilla base de Express.js + React.

- **No apto para producción** — no ha sido auditado para entornos con datos reales de clientes.
- **Credenciales de ejemplo** — las contraseñas y secretos en `.env.example` son ilustrativos.
  **Nunca usarlos en producción.**
- **Responsabilidad del equipo** — cada integrante es responsable de comprender el código que
  ejecuta y presenta como evidencia de aprendizaje.

---

## 📄 Licencia

[![CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)

Este proyecto se construyó sobre una plantilla base publicada bajo licencia
**Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)**
por [ergrato-dev](https://github.com/ergrato-dev). El código específico de Super Amigos
Grooming Spa (documentación de requisitos, módulos de negocio y frontend) se comparte bajo la
misma licencia.

- ✅ Puedes **compartir** y **adaptar** el material (incluyendo forks educativos).
- ❌ **No** puedes usarlo con fines comerciales.
- 🔁 Si adaptas o distribuyes el material, debes hacerlo bajo la **misma licencia**.
- 📌 Siempre debes dar **crédito al autor original de la plantilla base** (ergrato-dev).

Ver [`LICENSE`](LICENSE) para el texto completo.
