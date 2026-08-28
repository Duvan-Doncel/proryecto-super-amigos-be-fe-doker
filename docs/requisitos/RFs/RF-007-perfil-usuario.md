<!--
  ¿Qué? Requisito funcional que describe la consulta del perfil del usuario autenticado.
  ¿Para qué? Definir la lógica del endpoint GET /api/v1/users/me.
  ¿Impacto? Sin este endpoint, el frontend no puede mostrar los datos del usuario ni su rol.
-->

# RF-007 — Perfil de Usuario

**Historia de usuario relacionada**: HU-007

## Descripción

El sistema debe retornar el perfil completo del usuario autenticado (cliente o staff) mediante
el endpoint `GET /api/v1/users/me`.

---

## Flujo del proceso

| Paso | Descripción                                                                              |
| ---- | ------------------------------------------------------------------------------------------ |
| 1    | El cliente envía `GET /api/v1/users/me` con el header `Authorization: Bearer <accessToken>`. |
| 2    | El middleware `authenticate` verifica y decodifica el JWT.                               |
| 3    | El servicio busca al usuario por `req.userId` en la BD.                                  |
| 4    | Si el usuario no existe (cuenta eliminada), retorna HTTP 401.                             |
| 5    | Se retorna HTTP 200 con los datos del perfil (sin `hashedPassword`).                      |

---

## Reglas de Negocio

| ID     | Regla                                                                                         |
| ------ | ----------------------------------------------------------------------------------------------- |
| RN-070 | Requiere access token válido — el `userId` lo provee el middleware JWT exclusivamente.          |
| RN-071 | La respuesta nunca incluye el campo `hashedPassword`.                                           |
| RN-072 | La respuesta incluye `role` e `isEmailVerified` para que el frontend pueda usarlos.              |
| RN-073 | El `userId` viene del token, nunca de parámetros de ruta (evita IDOR).                           |

---

## Inputs / Outputs

**Input**: ninguno (el `userId` viene del JWT).

**Output éxito** (HTTP 200):
```json
{
  "id": "uuid",
  "documentId": "string",
  "firstName": "string",
  "lastName": "string",
  "phone": "string",
  "email": "string",
  "role": "client",
  "isEmailVerified": true,
  "createdAt": "timestamp"
}
```

**Output error 401** (token inválido):
```json
{ "error": "Unauthorized" }
```

---

## Endpoint

| Método | Ruta                 | Auth requerida | Descripción                        |
| ------ | -------------------- | -------------- | ----------------------------------- |
| GET    | `/api/v1/users/me`   | Sí             | Retorna el perfil del usuario       |
