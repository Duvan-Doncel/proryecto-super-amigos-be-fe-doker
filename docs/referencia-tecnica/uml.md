# Diagramas UML — Super Amigos Grooming Spa

<!--
  ¿Qué? Diagrama de casos de uso, especificación de los casos principales, diagrama de clases
  del dominio, diagrama de clases de la arquitectura del backend y diagramas de estado.
  ¿Para qué? Completar la documentación de análisis y diseño junto con los RFs/HUs
  (docs/requisitos/), el MER/MR (database-schema.md) y la arquitectura (architecture.md).
  ¿Impacto? Los diagramas están en Mermaid: GitHub los dibuja al abrir el archivo.
-->

## 1. Actores

| Actor | Descripción |
|---|---|
| **Visitante** | Persona sin sesión: ve la landing, el tarifario y la información de emergencia |
| **Cliente** | Dueño de mascota registrado y con correo verificado |
| **Staff** | Personal del spa (groomer, auxiliar en veterinaria, administración) |
| **Servidor de correo** | Sistema externo que entrega los correos de verificación y recuperación |

## 2. Diagrama de casos de uso

> Mermaid no tiene diagrama de casos de uso nativo; se representa con actores (círculos) y casos
> de uso (óvalos) dentro del límite del sistema. Las flechas punteadas son `<<include>>`.

```mermaid
flowchart LR
    V(("👤<br/>Visitante"))
    C(("👤<br/>Cliente"))
    S(("🛠️<br/>Staff"))
    M(("✉️<br/>Correo"))

    subgraph SAG["Sistema Super Amigos Grooming Spa"]
        direction TB
        UC1(["CU-01 Registrarse"])
        UC2(["CU-02 Verificar correo"])
        UC3(["CU-03 Iniciar sesión"])
        UC4(["CU-04 Recuperar / cambiar contraseña"])
        UC5(["CU-05 Consultar tarifario"])
        UC6(["CU-06 Ver información de emergencia 🔴"])
        UC7(["CU-07 Gestionar perfil"])
        UC8(["CU-08 Gestionar mis mascotas"])
        UC9(["CU-09 Agendar cita de grooming 🟢"])
        UC10(["CU-10 Cotizar precio"])
        UC11(["CU-11 Reportar síntoma leve 🟡"])
        UC12(["CU-12 Comprar en la tienda"])
        UC13(["CU-13 Gestionar agenda de citas"])
        UC14(["CU-14 Revisar síntomas"])
        UC15(["CU-15 Gestionar servicios y tarifario"])
        UC16(["CU-16 Gestionar productos"])
        UC17(["CU-17 Gestionar pedidos de clientes"])
        UC18(["CU-18 Gestionar proveedores y pedidos a proveedor"])
        UC19(["CU-19 Registrar venta de mostrador"])
        UC20(["CU-20 Ver reporte de ventas"])
        UC21(["CU-21 Crear cuenta de staff"])
        UC22(["CU-22 Consultar clientes y mascotas"])
    end

    V --- UC1 & UC3 & UC5 & UC6
    C --- UC3 & UC4 & UC7 & UC8 & UC9 & UC11 & UC12 & UC6
    S --- UC3 & UC4 & UC13 & UC14 & UC15 & UC16 & UC17 & UC18 & UC19 & UC20 & UC21 & UC22
    UC1 -. "include" .-> UC2
    UC9 -. "include" .-> UC10
    UC2 --- M
    UC4 --- M
```

| CU | Actor | RF / HU |
|---|---|---|
| CU-01, CU-02 | Visitante, Correo | RF-001, RF-003 |
| CU-03, CU-04 | Cliente, Staff | RF-002, RF-004, RF-005, RF-006 |
| CU-05 | Visitante | RF-014 |
| CU-06 | Visitante, Cliente | RF-011 |
| CU-07 | Cliente | RF-007 |
| CU-08 | Cliente | RF-012, RF-013 |
| CU-09, CU-10 | Cliente | RF-009, RF-014 |
| CU-11 | Cliente | RF-010 |
| CU-12 | Cliente | RF-015, RF-016 |
| CU-13 | Staff | RF-017 |
| CU-14 | Staff | RF-018 |
| CU-15 | Staff | RF-014 |
| CU-16 | Staff | RF-015 |
| CU-17 | Staff | RF-019 |
| CU-18 | Staff | RF-020, RF-021 |
| CU-19 | Staff | RF-023 |
| CU-20 | Staff | RF-022 |
| CU-21 | Staff | RF-008 |
| CU-22 | Staff | RF-012, RF-013 |

## 3. Especificación de casos de uso principales

### CU-09 — Agendar cita de grooming 🟢

| Campo | Detalle |
|---|---|
| Actor | Cliente |
| Precondición | Sesión iniciada, correo verificado y al menos una mascota registrada |
| Postcondición | Cita creada en estado `pending` con el precio congelado |
| Incluye | CU-10 Cotizar precio |

**Flujo principal**
1. El cliente entra a `/app/cita` (opción verde del semáforo).
2. Elige una de sus mascotas y un servicio.
3. El sistema cotiza el precio (base + tamaño + pelo + piel + comportamiento) y lo muestra.
4. El cliente elige fecha y hora y confirma.
5. El sistema valida las reglas y guarda la cita.
6. La cita aparece en "Mis citas" como pendiente.

**Flujos alternos**
- 3a. La mascota tiene una condición que bloquea (sarna, hongos, agresividad): el sistema muestra
  el aviso y sugiere reportar síntoma (CU-11). No se puede agendar (409).
- 5a. Hora fuera de 9:00–18:00, o fecha anterior a mañana: error 400 con mensaje.
- 5b. El día ya tiene 10 citas activas: error 400 "cupo lleno".

### CU-11 — Reportar síntoma leve 🟡

| Campo | Detalle |
|---|---|
| Actor | Cliente (reporta) · Staff (revisa en CU-14) |
| Precondición | Sesión iniciada y mascota propia |
| Postcondición | Reporte `pending`; al revisarlo, `reviewed` con recomendación |

1. El cliente describe el síntoma (≥ 3 caracteres) y los días que lleva.
2. El sistema guarda el reporte como pendiente.
3. La auxiliar lo revisa y escribe una recomendación (sin diagnóstico ni tratamiento).
4. El cliente ve la recomendación en su historial.

### CU-19 — Registrar venta de mostrador

| Campo | Detalle |
|---|---|
| Actor | Staff |
| Postcondición | Venta pagada registrada y stock descontado |

1. El staff agrega productos y cantidades.
2. Opcionalmente asocia un cliente registrado **o** escribe un nombre (no ambos).
3. El sistema verifica stock, descuenta inventario y guarda la venta con el precio del momento.
- 3a. Stock insuficiente: error 409, no se guarda nada.

---

## 4. Diagrama de clases — dominio

```mermaid
classDiagram
    direction LR

    class User {
        +UUID id
        +String documentId
        +String firstName
        +String lastName
        +String phone
        +String email
        -String hashedPassword
        +UserRole role
        +Boolean isEmailVerified
    }
    class Pet {
        +UUID id
        +String name
        +PetSpecies species
        +String breed
        +Int age
        +Decimal weight
        +PetSize size
        +CoatType coatType
        +PetBehavior behavior
        +String pathology
        +String photoUrl
    }
    class PetSkinCondition {
        +SkinConditionType type
        +String note
    }
    class Service {
        +UUID id
        +String name
        +Decimal price
        +Int durationMinutes
        +Boolean active
    }
    class ServiceSizeModifier {
        +PetSpecies species
        +PetSize size
        +Decimal amount
    }
    class ServiceCoatModifier {
        +PetSpecies species
        +CoatType coatType
        +Decimal amount
    }
    class Appointment {
        +UUID id
        +Date date
        +String time
        +AppointmentStatus status
        +Decimal totalPrice
        +Json priceBreakdown
    }
    class SymptomReport {
        +UUID id
        +String symptom
        +Int daysWithSymptom
        +SymptomReportStatus status
        +String recommendation
    }
    class Product {
        +UUID id
        +String name
        +Decimal price
        +Int stock
        +String category
        +Boolean active
    }
    class Order {
        +UUID id
        +OrderStatus status
        +PaymentStatus paymentStatus
        +Decimal total
    }
    class OrderItem {
        +Int quantity
        +Decimal unitPrice
    }
    class Sale {
        +UUID id
        +String clientName
        +Decimal total
    }
    class SaleItem {
        +Int quantity
        +Decimal unitPrice
    }
    class Supplier {
        +UUID id
        +String name
        +String contactName
        +String phone
        +String email
    }
    class SupplierOrder {
        +UUID id
        +SupplierOrderStatus status
        +Date expectedDate
        +Date receivedDate
    }
    class SupplierOrderItem {
        +Int quantity
        +Decimal unitCost
    }

    User "1" --> "0..*" Pet : es dueño
    Pet "1" *-- "0..*" PetSkinCondition : presenta
    User "1" --> "0..*" Appointment : agenda
    Pet "1" --> "0..*" Appointment
    Service "1" --> "0..*" Appointment
    Service "1" *-- "0..*" ServiceSizeModifier
    Service "1" *-- "0..*" ServiceCoatModifier
    User "1" --> "0..*" SymptomReport : reporta
    Pet "1" --> "0..*" SymptomReport
    User "1" --> "0..*" Order : realiza
    Order "1" *-- "1..*" OrderItem
    OrderItem "0..*" --> "1" Product
    User "0..1" --> "0..*" Sale : compra
    User "1" --> "0..*" Sale : registra (staff)
    Sale "1" *-- "1..*" SaleItem
    SaleItem "0..*" --> "1" Product
    Supplier "1" --> "0..*" SupplierOrder
    SupplierOrder "1" *-- "1..*" SupplierOrderItem
    SupplierOrderItem "0..*" --> "1" Product
```

`*--` = composición (el detalle no existe sin su dueño y se borra en cascada) · `-->` = asociación.

## 5. Diagrama de clases — arquitectura del backend (módulo Citas)

Todos los módulos siguen el mismo patrón; se muestra `appointments` como ejemplo.

```mermaid
classDiagram
    direction TB

    class AppointmentsRouter {
        <<router>>
        POST /quote
        POST /
        GET /me
        GET /availability
        PUT /:id
    }
    class AppointmentsController {
        <<controller>>
        +quote(req, res, next)
        +create(req, res, next)
        +listMine(req, res, next)
        +availability(req, res, next)
        +updateStatus(req, res, next)
        +agenda(req, res, next)
    }
    class AppointmentsService {
        <<service>>
        +quoteAppointment(clientId, input) PriceBreakdown
        +createAppointment(clientId, input) Appointment
        +listMyAppointments(clientId) Appointment[]
        +getAvailability(from, to) Availability
        +updateAppointmentStatus(id, status) Appointment
        +listAgendaByDate(date) Appointment[]
    }
    class PricingService {
        <<service>>
        +calculatePrice(serviceId, petId) PriceBreakdown
    }
    class AppointmentSchemas {
        <<zod>>
        createAppointmentSchema
        quoteAppointmentSchema
        updateAppointmentStatusSchema
        availabilityQuerySchema
    }
    class AuthMiddleware {
        <<middleware>>
        +authenticate()
        +requireRole(role)
    }
    class ValidateMiddleware {
        <<middleware>>
        +validate(schema)
        +validateQuery(schema)
    }
    class AppError {
        +Number statusCode
        +String code
    }
    class PrismaClient {
        <<ORM>>
        appointment
        pet
        service
    }

    AppointmentsRouter ..> AuthMiddleware : usa
    AppointmentsRouter ..> ValidateMiddleware : usa
    ValidateMiddleware ..> AppointmentSchemas : valida con
    AppointmentsRouter --> AppointmentsController
    AppointmentsController --> AppointmentsService
    AppointmentsService --> PricingService
    AppointmentsService --> PrismaClient
    AppointmentsService ..> AppError : lanza
    AppError <|-- ValidationError
    AppError <|-- UnauthorizedError
    AppError <|-- ForbiddenError
    AppError <|-- NotFoundError
    AppError <|-- ConflictError
    AppError <|-- BadRequestError
```

## 6. Diagramas de estado

### Cita

```mermaid
stateDiagram-v2
    [*] --> pending : cliente agenda
    pending --> confirmed : staff confirma
    pending --> cancelled : staff cancela
    confirmed --> completed : servicio realizado
    confirmed --> cancelled : staff cancela
    completed --> [*]
    cancelled --> [*]
    note right of cancelled : libera el cupo del día
```

### Pedido de cliente y pedido a proveedor

```mermaid
stateDiagram-v2
    state "Pedido de cliente" as O {
        [*] --> pending : cliente compra (descuenta stock)
        pending --> completed : staff entrega
        pending --> cancelled : staff cancela (devuelve stock)
    }
    state "Pedido a proveedor" as SO {
        [*] --> ordered : staff pide
        ordered --> received : llega la mercancía (suma stock)
    }
```
