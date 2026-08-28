<!--
  ¿Qué? Requisito funcional que describe la consulta de mascotas de un cliente.
  ¿Para qué? Definir la lógica del endpoint GET /api/v1/pets/me, usado por el selector de mascotas del semáforo.
  ¿Impacto? Sin esto, el cliente no podría elegir una mascota al agendar una cita o reportar un síntoma.
-->

# RF-013 — Listado de Mascotas del Cliente

**Historia de usuario relacionada**: HU-013

## Descripción

El sistema debe permitir que un cliente autenticado consulte la lista de sus propias mascotas
mediante `GET /api/v1/pets/me`. El staff, por su parte, puede consultar las mascotas de cualquier
cliente mediante `GET /api/v1/pets?clientId=...`.

---

## Flujo del proceso

| Paso | Descripción                                                                              |
| ---- | ------------------------------------------------------------------------------------------ |
| 1    | El cliente autenticado envía `GET /api/v1/pets/me`.                                      |
| 2    | El middleware `authenticate` verifica el JWT y extrae `clientId`.                        |
| 3    | El servicio consulta la tabla `pets` filtrando por `clientId`.                           |
| 4    | Se retorna HTTP 200 con la lista de mascotas (puede ser un arreglo vacío).                |

---

## Reglas de Negocio

| ID     | Regla                                                                                       |
| ------ | ---------------------------------------------------------------------------------------------- |
| RN-130 | Un cliente solo puede ver sus propias mascotas — nunca las de otro cliente.                    |
| RN-131 | El staff puede consultar las mascotas de cualquier cliente, pasando `clientId` como query param. |
| RN-132 | Si el cliente no tiene mascotas registradas, se retorna un arreglo vacío (no un error).          |

---

## Inputs / Outputs

**Output éxito** (HTTP 200):
```json
[
  { "id": "uuid", "name": "Firulais", "species": "dog", "breed": "Criollo", "age": 3 },
  { "id": "uuid", "name": "Michi", "species": "cat", "breed": "Criollo", "age": 1 }
]
```

---

## Endpoints

| Método | Ruta                              | Auth requerida    | Descripción                                |
| ------ | ---------------------------------- | ------------------ | ---------------------------------------------- |
| GET    | `/api/v1/pets/me`                  | Sí (role: client)  | Lista las mascotas del cliente autenticado     |
| GET    | `/api/v1/pets?clientId={id}`       | Sí (role: staff)   | Lista las mascotas de un cliente específico    |
