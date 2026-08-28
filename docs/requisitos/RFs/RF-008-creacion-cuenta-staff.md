<!--
  ¿Qué? Requisito funcional que describe cómo se crean nuevas cuentas de staff/admin.
  ¿Para qué? Definir el endpoint POST /api/v1/staff y quién tiene permiso de usarlo.
  ¿Impacto? Sin esto no habría forma de dar de alta a nuevo personal sin acceso directo a la base de datos.
-->

# RF-008 — Creación de Cuenta de Staff

**Historia de usuario relacionada**: HU-008

## Descripción

No existe registro público para cuentas de staff. Solo un usuario que ya tiene `role = 'staff'`
autenticado puede crear otra cuenta de staff, mediante `POST /api/v1/staff`. La primera cuenta de
staff del sistema se crea directamente en la base de datos (seed inicial) al desplegar el proyecto.

---

## Flujo del proceso

| Paso | Descripción                                                                                    |
| ---- | ------------------------------------------------------------------------------------------------ |
| 1    | Un usuario con `role = 'staff'` autenticado envía `POST /api/v1/staff` con `{ firstName, lastName, email, password }`. |
| 2    | El middleware `authMiddleware` verifica el JWT y que `role === 'staff'`; si no, retorna HTTP 403. |
| 3    | El middleware `validate` verifica el body con el schema Zod `createStaffSchema`.                |
| 4    | El servicio verifica que el email no exista ya en la tabla `users`.                              |
| 5    | Si existe, se retorna HTTP 409.                                                                  |
| 6    | Se hashea la contraseña con bcrypt (salt rounds = 12).                                           |
| 7    | Se inserta el nuevo usuario con `role = 'staff'`.                                                |
| 8    | Se retorna HTTP 201 con los datos del nuevo staff creado (sin `hashedPassword`).                  |

---

## Reglas de Negocio

| ID     | Regla                                                                                       |
| ------ | -------------------------------------------------------------------------------------------- |
| RN-001 | Solo un usuario autenticado con `role = 'staff'` puede crear otra cuenta de staff.           |
| RN-002 | Un cliente (`role = 'client'`) que intente llamar este endpoint recibe HTTP 403.             |
| RN-003 | El email debe ser único en el sistema (compartido entre clientes y staff).                   |
| RN-004 | La contraseña sigue las mismas reglas de fortaleza que en RF-001 (RN-004).                   |

---

## Inputs / Outputs

**Input** (body JSON):
```json
{ "firstName": "string", "lastName": "string", "email": "string", "password": "string" }
```

**Output éxito** (HTTP 201):
```json
{ "id": "uuid", "firstName": "string", "lastName": "string", "email": "string", "role": "staff", "createdAt": "timestamp" }
```

**Output error 403** (quien llama no es staff):
```json
{ "error": "Forbidden — staff role required" }
```

---

## Endpoint

| Método | Ruta              | Auth requerida    | Descripción                        |
| ------ | ----------------- | ----------------- | ------------------------------------ |
| POST   | `/api/v1/staff`   | Sí (role: staff)  | Crea una nueva cuenta de staff       |
