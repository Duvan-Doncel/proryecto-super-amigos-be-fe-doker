<!--
  ¿Qué? Requisito funcional que describe la gestión del catálogo de servicios de grooming.
  ¿Para qué? Definir los endpoints CRUD de /api/v1/services, usados tanto por el admin como por el cliente al agendar.
  ¿Impacto? Sin esto, no habría forma de ajustar precios (que cambian cada año) sin modificar código.
-->

# RF-014 — Catálogo de Servicios

**Historia de usuario relacionada**: HU-014

## Descripción

El sistema debe permitir al staff administrar el catálogo de servicios de grooming (nombre,
descripción, precio, duración) mediante endpoints CRUD en `/api/v1/services`. El catálogo de
servicios **activos** también debe poder consultarse públicamente, ya que el cliente lo necesita
para elegir un servicio al agendar una cita (RF-009).

---

## Flujo del proceso

| Paso | Descripción                                                                                     |
| ---- | ------------------------------------------------------------------------------------------------ |
| 1    | El staff autenticado envía `POST /api/v1/services` con `{ name, description, price, durationMinutes }` para crear un servicio. |
| 2    | El middleware `authenticate` verifica que `role === 'staff'`; si no, retorna HTTP 403.           |
| 3    | El middleware `validate` verifica el body con el schema Zod `serviceSchema`.                     |
| 4    | Se inserta el servicio en la tabla `services` con `active = true`.                                |
| 5    | Para editar: `PUT /api/v1/services/:id` con los campos a actualizar (incluye `active` para activar/desactivar). |
| 6    | Para eliminar: `DELETE /api/v1/services/:id` — si el servicio tiene citas asociadas, en vez de borrarlo se marca `active = false` (soft delete). |
| 7    | Cualquier persona (autenticada o no) puede consultar `GET /api/v1/services?active=true` para ver el catálogo vigente. |

---

## Reglas de Negocio

| ID     | Regla                                                                                         |
| ------ | ------------------------------------------------------------------------------------------------ |
| RN-140 | Solo un usuario con `role = 'staff'` puede crear, editar o desactivar servicios.                  |
| RN-141 | El campo `price` debe ser un número mayor a 0.                                                    |
| RN-142 | El campo `durationMinutes` debe ser un número entero mayor a 0.                                   |
| RN-143 | Un servicio con citas asociadas no se elimina físicamente — se desactiva (`active = false`).      |
| RN-144 | El endpoint público `GET /api/v1/services` solo retorna servicios con `active = true` por defecto. |
| RN-145 | El staff puede consultar también los servicios inactivos con `GET /api/v1/services?active=false`. |

---

## Inputs / Outputs

**Input** (`POST` / `PUT`):
```json
{ "name": "Baño y corte", "description": "string (opcional)", "price": 45000, "durationMinutes": 60 }
```

**Output éxito** (HTTP 201/200):
```json
{
  "id": "uuid",
  "name": "Baño y corte",
  "description": "string",
  "price": 45000,
  "durationMinutes": 60,
  "active": true,
  "createdAt": "timestamp"
}
```

**Output error 403**:
```json
{ "error": "Forbidden — staff role required" }
```

---

## Endpoints

| Método | Ruta                       | Auth requerida    | Descripción                              |
| ------ | -------------------------- | ------------------ | ------------------------------------------- |
| GET    | `/api/v1/services`         | No                  | Lista los servicios (activos por defecto)   |
| POST   | `/api/v1/services`         | Sí (role: staff)    | Crea un nuevo servicio                       |
| PUT    | `/api/v1/services/:id`     | Sí (role: staff)    | Edita un servicio (incluye precio y activo)  |
| DELETE | `/api/v1/services/:id`     | Sí (role: staff)    | Elimina o desactiva un servicio              |
