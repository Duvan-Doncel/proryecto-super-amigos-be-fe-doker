# Arquitectura del sistema — Super Amigos Grooming Spa

<!--
  ¿Qué? Diagramas y descripción de la arquitectura de GroomingSpa: contexto, contenedores,
  capas del backend y del frontend, despliegue, integración continua y un flujo de punta a punta.
  ¿Para qué? Evidenciar cómo se aplican los patrones vistos en la formación (cliente-servidor,
  API REST, arquitectura en capas, separación por módulos, contenedores) en ESTE proyecto.
  ¿Impacto? Reemplaza la versión heredada de la plantilla ("NN Auth"). Los diagramas están en
  Mermaid: GitHub los dibuja automáticamente al abrir este archivo.
-->

## 1. Visión general

GroomingSpa es una aplicación **cliente-servidor** de tres niveles:

| Nivel | Tecnología | Responsabilidad |
|---|---|---|
| Presentación | React 19 + Vite + TypeScript + TailwindCSS (SPA) | Pantallas del cliente (semáforo, tienda, perfil) y del staff (agenda, inventario, ventas) |
| Lógica de negocio | Node.js 22 + Express 5 + TypeScript (API REST `/api/v1`) | Autenticación JWT, reglas de citas, motor de precios, inventario |
| Datos | PostgreSQL 17 + Prisma ORM | 22 tablas, migraciones versionadas |

Servicios de apoyo: **Mailpit** (SMTP de desarrollo para verificación de correo y recuperación de
contraseña) y **Google Maps** (veterinarias cercanas en la pantalla de emergencia).

## 2. Diagrama de contexto

```mermaid
flowchart LR
    cliente(["👤 Cliente<br/>dueño de mascota"])
    staff(["🛠️ Staff<br/>groomer / auxiliar / admin"])
    sag["🐾 Super Amigos<br/>Grooming Spa"]
    mail["✉️ Servidor de correo<br/>(Mailpit en desarrollo)"]
    maps["🗺️ Google Maps"]

    cliente -- "agenda citas, reporta síntomas,<br/>compra productos" --> sag
    staff -- "gestiona agenda, tarifas, inventario,<br/>proveedores y ventas" --> sag
    sag -- "verificación y recuperación<br/>de contraseña" --> mail
    sag -- "veterinarias cercanas<br/>(emergencia 🔴)" --> maps
```

## 3. Diagrama de contenedores (despliegue con Docker Compose)

```mermaid
flowchart TB
    browser["🌐 Navegador<br/>React SPA"]

    subgraph docker["docker-compose.yml · red groomingspa_network"]
        fe["<b>fe</b> · nginx<br/>build estático de Vite<br/>:5173 → 80"]
        be["<b>be</b> · Node 22 + Express 5<br/>API REST /api/v1<br/>:3000"]
        db[("<b>db</b> · PostgreSQL 17<br/>groomingspa_db<br/>:5433 → 5432<br/>volumen groomingspa_data")]
        mail["<b>mailpit</b><br/>SMTP :1025 · UI :8025"]
        up[/"./be/uploads (bind mount)<br/>fotos de mascotas"/]
    end

    browser -- "HTTP: HTML/JS/CSS" --> fe
    browser -- "HTTP JSON + Bearer JWT<br/>(axios)" --> be
    be -- "Prisma Client (SQL)" --> db
    be -- "nodemailer (SMTP)" --> mail
    be --- up
```

> El frontend se sirve como archivos estáticos; el navegador llama **directamente** al API usando
> `VITE_API_BASE_URL`. El backend solo acepta peticiones del origen configurado en `FRONTEND_URL` (CORS).

## 4. Arquitectura del backend — capas y módulos

Patrón **en capas por módulo** (*modular monolith*): cada dominio vive en
`be/src/modules/<modulo>/` con los mismos 4 archivos.

```mermaid
flowchart TB
    req(["Petición HTTP"]) --> mw

    subgraph mw["Middlewares globales (app.ts)"]
        direction LR
        h["helmet"] --> c["cors"] --> j["express.json"] --> rl["rate-limit<br/>(solo /auth)"]
    end

    mw --> router

    subgraph modulo["Módulo (ej. appointments/)"]
        router["<b>*.router.ts</b><br/>ruta + authenticate + requireRole + validate(zod)"]
        ctrl["<b>*.controller.ts</b><br/>lee req, responde { success, data }"]
        svc["<b>*.service.ts</b><br/>reglas de negocio"]
        schema["<b>*.schema.ts</b><br/>schemas zod + tipos"]
        router --> ctrl --> svc
        schema -.-> router
    end

    svc --> prisma["Prisma Client<br/>(db/index.ts)"] --> pg[("PostgreSQL")]
    svc -. "errores AppError" .-> err["error.middleware.ts<br/>→ { success:false, error:{ code, message } }"]
```

| Capa | Responsabilidad | No debe |
|---|---|---|
| Router | Declarar ruta, autenticación, rol y validación | Tener lógica de negocio |
| Controller | Traducir HTTP ↔ servicio, elegir código de estado | Acceder a la BD |
| Service | Reglas de negocio (horario, cupo, precio, stock) | Conocer `req`/`res` |
| Prisma | Acceso a datos tipado | — |

**Módulos (14)**: `auth`, `users`, `staff`, `pets`, `services`, `pricing`, `appointments`,
`symptom-reports`, `emergency-info`, `products`, `orders`, `suppliers`, `supplier-orders`, `sales`.

**Transversales** (`be/src/middlewares`, `be/src/utils`): `auth.middleware` (JWT + rol),
`validate.middleware` (zod), `upload.middleware` (fotos con multer), `error.middleware`,
`audit-log` (eventos de seguridad), `email` (nodemailer), `security` (bcrypt + JWT),
`config.ts` (valida variables de entorno al arrancar; si falta una, el proceso termina con mensaje claro).

## 5. Arquitectura del frontend

```mermaid
flowchart TB
    main["main.tsx"] --> providers["Providers<br/>ThemeProvider · AuthProvider · ToastProvider · AuthModalProvider"]
    providers --> app["App.tsx — React Router"]

    app --> pub["Rutas públicas<br/>/ · /login · /register · /precios · /verify-email · legales"]
    app --> pr1["ProtectedRoute role=client<br/>/app · cita · sintoma · emergencia · tienda · perfil"]
    app --> pr2["ProtectedRoute role=staff<br/>/staff · agenda · mascotas · clientes · servicios · tarifario ·<br/>productos · pedidos · proveedores · ventas · reporte-ventas"]

    pr1 & pr2 & pub --> pages["pages/ (client, staff)"]
    pages --> comps["components/ (ui, layout, pets, calendar, charts)"]
    pages --> api["api/*.ts — un archivo por módulo del backend"]
    api --> axios["api/axios.ts<br/>interceptor: agrega Bearer y renueva el token con /auth/refresh"]
    axios --> BE[("API /api/v1")]
```

- **Estado de sesión**: `AuthContext` guarda el usuario y los tokens; `ProtectedRoute` redirige a
  `/login` sin sesión, y a `/app` si un cliente intenta entrar a una ruta de staff.
- **Tipos compartidos**: `fe/src/types/*` replica los DTO del backend (un archivo por módulo).
- **Tema claro/oscuro**: `ThemeProvider` con variables de Tailwind.

## 6. Flujo de punta a punta — agendar una cita (🟢 semáforo)

```mermaid
sequenceDiagram
    actor C as Cliente
    participant FE as React (AppointmentPage)
    participant BE as Express /appointments
    participant S as appointments.service
    participant P as pricing (motor)
    participant DB as PostgreSQL

    C->>FE: Elige mascota y servicio
    FE->>BE: POST /appointments/quote {petId, serviceId}
    BE->>P: calcular precio
    P->>DB: servicio, modificadores, reglas
    P-->>FE: 200 {total, breakdown, blocked}
    FE-->>C: Muestra precio estimado (o aviso de bloqueo)
    C->>FE: Elige fecha y hora, confirma
    FE->>BE: POST /appointments {petId, serviceId, date, time}
    BE->>BE: authenticate + requireRole(client) + validate(zod)
    BE->>S: create()
    S->>S: horario 9–18 · desde mañana · mascota propia
    S->>DB: contar citas del día (sin canceladas)
    alt cupo lleno (10) o condición bloqueante
        S-->>FE: 400 / 409 PET_CONDITION_BLOCKS_BOOKING
    else OK
        S->>DB: INSERT appointment (precio congelado)
        S-->>FE: 201 {success, data}
        FE-->>C: Cita en "Mis citas" (pendiente)
    end
```

## 7. Integración continua

```mermaid
flowchart LR
    dev["Rama test/* o feat/*"] -- "push / PR" --> gh["GitHub"]
    gh --> ci{{"Workflow tests.yml"}}
    ci --> j1["frontend<br/>pnpm test:coverage"]
    ci --> j2["backend<br/>Postgres 17 + Mailpit como servicios<br/>migraciones + test:coverage"]
    ci --> j3["evidencia-individual<br/>commits de test por autor"]
    j1 & j2 --> ok{"¿verde?"}
    ok -- sí --> rev["Revisión por otro integrante"] --> main["merge a main"]
    ok -- no --> dev
```

## 8. Patrones y decisiones técnicas

| Decisión | Por qué |
|---|---|
| API REST versionada (`/api/v1`) | Contrato estable entre FE y BE; permite evolucionar sin romper clientes |
| Arquitectura en capas por módulo | Cada dominio es independiente y fácil de probar (el service se prueba sin HTTP) |
| JWT stateless (access 15 min + refresh 7 días) | No requiere sesiones en servidor; el refresh evita pedir login seguido |
| Prisma ORM | Tipos generados desde el schema, migraciones versionadas, consultas parametrizadas (evita SQL injection). Se migró desde Drizzle por un CVE de SQL injection |
| Validación con zod en el borde | Ningún dato inválido llega al service; errores 422 legibles para el formulario |
| Precio congelado en la cita (`priceBreakdown`) | Si el staff cambia el tarifario, las citas ya agendadas conservan su precio |
| Docker Compose | El proyecto completo se levanta igual en cualquier computador |
| BD de pruebas separada | Los tests vacían tablas: nunca deben tocar la BD de desarrollo |

## 9. Consideraciones para producción

- Cambiar `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` y credenciales de BD (los de `.env.example` son de ejemplo).
- Reemplazar Mailpit por un SMTP real (`MAIL_HOST`, `MAIL_PORT`, `MAIL_FROM`).
- Servir FE y BE detrás de HTTPS; ajustar `FRONTEND_URL` y `VITE_API_BASE_URL` al dominio real.
- Guardar las fotos de mascotas en almacenamiento persistente (volumen o bucket), no dentro de la imagen.
