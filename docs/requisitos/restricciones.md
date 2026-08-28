<!--
  ¿Qué? Restricciones globales que gobiernan todo el proyecto GroomingSpa.
  ¿Para qué? Definir límites claros de tecnología, diseño, seguridad y organización que no son negociables.
  ¿Impacto? Cualquier decisión técnica o de diseño debe verificarse contra estas restricciones antes de implementarse.
-->

# Restricciones del Proyecto — Super Amigos Grooming Spa

---

## 1. Restricciones Tecnológicas

### RT-001 — Stack Tecnológico Fijo

El stack tecnológico fue elegido por el propio equipo (no es exigido por el instructor) y, una
vez elegido, **no debe cambiarse a mitad de proyecto**:

| Capa            | Tecnología                                          |
| --------------- | ---------------------------------------------------- |
| Runtime         | Node.js 20 LTS                                        |
| Framework BE    | Express.js + TypeScript                                |
| Framework FE    | React + Vite + TypeScript                               |
| Base de datos   | PostgreSQL                                                |
| ORM             | Prisma ORM + Prisma Migrate                                 |
| Validación      | Zod (BE) — exclusivamente                                     |
| Auth            | JWT (jsonwebtoken) — access 15 min + refresh 7 días             |
| Hashing         | bcryptjs (salt rounds = 12)                                       |
| Email (dev)     | Nodemailer + Mailpit                                                |

### RT-002 — Gestión de Paquetes

- **`pnpm` exclusivamente** — `npm` y `yarn` están **prohibidos**, salvo para instalar `pnpm` la primera vez.
- Versiones de dependencias siempre exactas — evitar rangos `^`, `~`, `>=`, `*` ni `latest`.

### RT-003 — Idioma

- Todo el sistema (interfaz, mensajes de error, documentación) está en **español** — no se requiere soporte multi-idioma en este alcance.

---

## 2. Restricciones de Herramientas y Entorno

### RH-001 — Linter y Formateador

- ESLint y Prettier son obligatorios en `be/` y `fe/`.
- El código debe pasar `pnpm lint` sin errores antes de cada commit.

### RH-002 — Control de Versiones

- Ramas: `main` (estable) y `dev` (desarrollo activo).
- **NUNCA** hacer commits directamente en `main`.
- **NUNCA** usar `git push --force`.

### RH-003 — Entorno de Desarrollo

- PostgreSQL debe levantarse con `docker compose up -d` en desarrollo.
- También es válida la instalación directa de PostgreSQL sin Docker si el equipo lo prefiere.

---

## 3. Restricciones de Negocio

### RN-001 — Horario de Atención

- Las citas de grooming solo pueden agendarse entre las **9:00 a.m. y las 6:00 p.m.**
- Toda cita debe agendarse con, mínimo, un día de anticipación (no se permite agendar para el mismo día).

### RN-002 — Alcance Médico

- GroomingSpa **no** es una veterinaria ni cuenta con veterinario profesional en planta.
- El sistema **no** debe implementar historia clínica, diagnóstico ni prescripción de medicamentos — el flujo de síntomas leves (RF-010) se limita a registrar el síntoma y dejar una recomendación de texto libre.
- Las emergencias (RF-011) siempre se remiten a veterinarias externas — GroomingSpa no las atiende internamente.

### RN-003 — Pagos

- No existe pasarela de pago en línea en este alcance. Todo pago (citas, productos) se realiza presencialmente en el local y lo registra el staff.

---

## 4. Restricciones de Idioma (código vs. documentación)

### RI-001 — Código en Inglés

Todo lo que sea código debe estar en inglés: variables, funciones, clases, nombres de archivos y
carpetas de código, endpoints, nombres de tablas y columnas, nombres de componentes React,
mensajes de commits.

### RI-002 — Documentación y Comentarios en Español

Todo lo que sea documentación debe estar en español: comentarios en el código, archivos `.md`,
README, mensajes de error visibles al usuario en la UI.

---

## 5. Restricciones Organizacionales

### RO-001 — Propósito Educativo

- El proyecto es un ejercicio formativo del SENA — se prioriza la claridad y el aprendizaje del equipo sobre la optimización prematura.
- Cada archivo nuevo debe incluir cabecera de documentación (¿Qué? / ¿Para qué? / ¿Impacto?).

### RO-002 — Variables de Entorno

- El archivo `.env` **no debe versionarse** (debe estar en `.gitignore`).
- El archivo `.env.example` siempre debe estar actualizado con todas las variables necesarias.
- **Prohibido** hardcodear: contraseñas, secretos JWT, credenciales de BD, claves de APIs externas (por ejemplo, la API de mapas usada en RF-011).

---

## 6. Restricciones de Seguridad

### RS-001 — Contraseñas

- Nunca almacenar contraseñas en texto plano.
- Nunca exponer `hashedPassword` en respuestas HTTP.

### RS-002 — Secrets y Credenciales

- Nunca hardcodear secrets, claves JWT o credenciales de BD en el código fuente.
- Usar variables de entorno exclusivamente para toda configuración sensible.

### RS-003 — CORS y Headers

- Nunca usar `cors({ origin: '*' })` en producción.
- Usar `helmet` para configurar automáticamente los headers de seguridad HTTP.
