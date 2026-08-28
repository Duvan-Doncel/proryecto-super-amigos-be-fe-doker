<!--
  ¿Qué? Requisito funcional que describe el cambio de contraseña de un usuario autenticado.
  ¿Para qué? Definir la lógica del endpoint POST /api/v1/auth/change-password.
  ¿Impacto? Sin verificar la contraseña actual, un token comprometido permitiría tomar
    control de la cuenta cambiando la contraseña sin saberla.
-->

# RF-004 — Cambio de Contraseña

**Historia de usuario relacionada**: HU-004

## Descripción

El sistema debe permitir a un usuario autenticado (cliente o staff) cambiar su contraseña,
verificando primero la contraseña actual, mediante el endpoint `POST /api/v1/auth/change-password`.

---

## Flujo del proceso

| Paso | Descripción                                                                              |
| ---- | ------------------------------------------------------------------------------------------ |
| 1    | El cliente envía `POST /api/v1/auth/change-password` con `{ currentPassword, newPassword }` y el header `Authorization: Bearer <accessToken>`. |
| 2    | El middleware `authenticate` verifica y decodifica el JWT.                               |
| 3    | El middleware `validate` verifica el body con `changePasswordSchema`.                    |
| 4    | El servicio busca al usuario por `req.userId` en la BD.                                  |
| 5    | Se verifica `currentPassword` con bcrypt contra `hashedPassword`. Si no coincide, retorna HTTP 401. |
| 6    | Si `newPassword === currentPassword`, retorna HTTP 400.                                  |
| 7    | Se genera el hash bcrypt de `newPassword` (salt rounds = 12).                             |
| 8    | Se actualiza `hashedPassword` en la tabla `users`.                                        |
| 9    | Se retorna HTTP 200 con mensaje de confirmación.                                          |

---

## Reglas de Negocio

| ID     | Regla                                                                                         |
| ------ | ------------------------------------------------------------------------------------------------ |
| RN-030 | Requiere access token válido — el `userId` lo provee el middleware JWT exclusivamente.          |
| RN-031 | La contraseña actual (`currentPassword`) debe coincidir con el hash almacenado en la BD.         |
| RN-032 | La nueva contraseña debe cumplir los mismos requisitos de fortaleza que en el registro.           |
| RN-033 | La nueva contraseña no puede ser igual a la contraseña actual.                                    |

---

## Inputs / Outputs

**Input** (body JSON):
```json
{ "currentPassword": "string", "newPassword": "string" }
```

**Output éxito** (HTTP 200):
```json
{ "success": true, "message": "Contraseña cambiada correctamente." }
```

**Output error 401** (contraseña actual incorrecta):
```json
{ "error": "Current password is incorrect" }
```

**Output error 400** (nueva = actual):
```json
{ "error": "New password must be different from current password" }
```

---

## Endpoint

| Método | Ruta                            | Auth requerida | Descripción                       |
| ------ | -------------------------------- | -------------- | ----------------------------------- |
| POST   | `/api/v1/auth/change-password`   | Sí             | Cambia la contraseña del usuario    |
