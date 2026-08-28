<!--
  ¿Qué? Requisito funcional que describe la opción de emergencia del semáforo (información, no agendamiento).
  ¿Para qué? Definir el endpoint GET /api/v1/emergency-info y quién administra su contenido.
  ¿Impacto? Sin esto, un cliente con una emergencia real no sabría a dónde acudir fuera del horario o alcance de GroomingSpa.
-->

# RF-011 — Emergencia: Veterinarias Cercanas (🔴)

**Historia de usuario relacionada**: HU-011

## Descripción

GroomingSpa no atiende emergencias veterinarias — no tiene veterinario profesional en planta. Por
eso, la opción roja del semáforo **no agenda nada**: solo le muestra al cliente un mapa con
veterinarias cercanas y una lista de números de emergencia, mediante `GET /api/v1/emergency-info`.

El contenido (números de teléfono y texto de la lista de emergencia) es administrable por el staff,
para no depender de un despliegue nuevo cada vez que cambie un número.

---

## Flujo del proceso

| Paso | Descripción                                                                                     |
| ---- | ------------------------------------------------------------------------------------------------ |
| 1    | El cliente abre la opción 🔴 en el semáforo; el frontend llama `GET /api/v1/emergency-info`.     |
| 2    | El servicio retorna la lista de números de emergencia configurados por el staff.                |
| 3    | El frontend muestra el mapa embebido (con la ubicación de búsqueda "veterinarias cercanas") y la lista de números. |
| 4    | *(Staff)* Desde el panel administrativo, el staff puede editar la lista de números mediante `PUT /api/v1/emergency-info`. |

---

## Reglas de Negocio

| ID     | Regla                                                                                         |
| ------ | ------------------------------------------------------------------------------------------------ |
| RN-110 | El endpoint `GET /api/v1/emergency-info` es público — no requiere autenticación (una emergencia no debería depender de tener sesión iniciada). |
| RN-111 | Solo el staff autenticado puede modificar los números de emergencia (`PUT`).                     |
| RN-112 | Esta opción **no** crea ningún registro de cita ni reporte — es puramente informativa.            |
| RN-113 | La clave de la API de mapas (Google Maps u otra) debe leerse de una variable de entorno — nunca debe escribirse directamente en el código del frontend. |

---

## Inputs / Outputs

**Output** (`GET /api/v1/emergency-info`, HTTP 200):
```json
{
  "searchQuery": "veterinarias cerca de Soacha, Cundinamarca",
  "emergencyPhones": [
    { "label": "Clínica Veterinaria 24h", "phone": "601 123 4567" },
    { "label": "Línea de emergencias animales", "phone": "123" }
  ]
}
```

---

## Endpoint

| Método | Ruta                          | Auth requerida    | Descripción                                |
| ------ | ----------------------------- | ------------------ | --------------------------------------------- |
| GET    | `/api/v1/emergency-info`      | No                  | Retorna el mapa de búsqueda y números de emergencia |
| PUT    | `/api/v1/emergency-info`      | Sí (role: staff)    | Actualiza los números de emergencia            |
