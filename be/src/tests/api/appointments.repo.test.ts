/**
 * Archivo: tests/api/appointments.repo.test.ts
 * Descripción: Semana 5, capa BD. El repositorio (Prisma `db`) visto como dependencia
 *   del servicio de citas, reemplazado con dobles de prueba.
 * ¿Para qué? Verificar que createAppointment NO guarda nada ante datos inválidos y que,
 *   con datos válidos, guarda exactamente lo correcto.
 * ¿Impacto? Vive en tests/api/ porque ese proyecto de Vitest no usa setup.ts:
 *   no necesita Docker ni Postgres.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ¿Qué? Doble de Prisma con solo los métodos que usa createAppointment.
vi.mock("../../db/index.js", () => ({
  db: {
    appointment: { count: vi.fn(), create: vi.fn() },
    service: { findUnique: vi.fn() },
  },
}));

// ¿Qué? Stubs de módulos propios del proyecto (no librerías de terceros).
// ¿Para qué? La mascota y el precio ya tienen sus propios tests; aquí solo importa el repositorio.
vi.mock("../../modules/pets/pets.service.js", () => ({
  assertPetBelongsToClient: vi.fn(),
}));
vi.mock("../../modules/pricing/pricing.service.js", () => ({
  calculatePrice: vi.fn(),
}));

import { db } from "../../db/index.js";
import { calculatePrice } from "../../modules/pricing/pricing.service.js";
import { createAppointment } from "../../modules/appointments/appointments.service.js";

const dbMock = vi.mocked(db, true);
const calculatePriceStub = vi.mocked(calculatePrice);

const CLIENT_ID = "11111111-1111-4111-8111-111111111111";
const PET_ID = "44444444-4444-4444-8444-444444444444";
const SERVICE_ID = "55555555-5555-4555-8555-555555555555";

// ¿Qué? Fecha lejana para que la regla "a partir de mañana" siempre se cumpla.
const datosValidos = {
  petId: PET_ID,
  serviceId: SERVICE_ID,
  date: "2030-01-15",
  time: "10:00",
  notes: "Primera visita",
};

function precio(overrides: Record<string, unknown> = {}) {
  return {
    serviceId: SERVICE_ID,
    serviceName: "Baño completo",
    petId: PET_ID,
    petName: "Toby",
    base: 40000,
    lines: [],
    total: 45000,
    blocked: false,
    blockingConditions: [],
    ...overrides,
  };
}

// ¿Qué? Fake del repositorio: guarda las citas en un arreglo en memoria.
let citasGuardadas: Record<string, unknown>[];

beforeEach(() => {
  vi.clearAllMocks();
  citasGuardadas = [];

  dbMock.service.findUnique.mockResolvedValue({
    id: SERVICE_ID,
    active: true,
  } as never);
  dbMock.appointment.count.mockResolvedValue(0);
  calculatePriceStub.mockResolvedValue(precio() as never);
  dbMock.appointment.create.mockImplementation((async ({
    data,
  }: {
    data: Record<string, unknown>;
  }) => {
    const cita = {
      id: "22222222-2222-4222-8222-222222222222",
      status: "pending",
      createdAt: new Date("2026-11-09T12:00:00.000Z"),
      ...data,
    };
    citasGuardadas.push(cita);
    return cita;
  }) as never);
});

describe("createAppointment con el repositorio como dependencia (S5 BD)", () => {
  // Doble: MOCK. Verifica COMPORTAMIENTO: el repositorio no se toca si la hora es inválida.
  it("no guarda la cita si la hora está fuera del horario de atención", async () => {
    await expect(
      createAppointment(CLIENT_ID, { ...datosValidos, time: "19:00" }),
    ).rejects.toThrow("La hora debe estar entre las 9:00am y las 6:00pm.");

    expect(dbMock.appointment.create).not.toHaveBeenCalled();
    expect(dbMock.service.findUnique).not.toHaveBeenCalled();
  });

  // Doble: STUB. count devuelve 10 (día lleno) para provocar el caso sin cupos.
  // Verifica COMPORTAMIENTO: create no se llama.
  it("no guarda la cita si ya no quedan cupos ese día", async () => {
    dbMock.appointment.count.mockResolvedValue(10);

    await expect(createAppointment(CLIENT_ID, datosValidos)).rejects.toThrow(
      "Ya no quedan cupos disponibles",
    );

    expect(dbMock.appointment.create).not.toHaveBeenCalled();
  });

  // Doble: STUB de calculatePrice con una condición de piel que bloquea.
  // Verifica COMPORTAMIENTO: con la mascota bloqueada no se guarda nada.
  it("no guarda la cita si la mascota necesita revisión veterinaria", async () => {
    calculatePriceStub.mockResolvedValue(
      precio({ blocked: true, blockingConditions: ["Dermatitis"] }) as never,
    );

    await expect(createAppointment(CLIENT_ID, datosValidos)).rejects.toThrow(
      "Dermatitis",
    );

    expect(dbMock.appointment.create).not.toHaveBeenCalled();
  });

  // Doble: FAKE (arreglo en memoria). Verifica ESTADO: qué quedó guardado.
  it("guarda una sola cita con el cliente, la fecha y el precio congelado", async () => {
    const respuesta = await createAppointment(CLIENT_ID, datosValidos);

    expect(citasGuardadas).toHaveLength(1);
    expect(citasGuardadas[0]).toMatchObject({
      clientId: CLIENT_ID,
      petId: PET_ID,
      serviceId: SERVICE_ID,
      time: "10:00",
      totalPrice: 45000,
    });
    expect(respuesta.date).toBe("2030-01-15");
    expect(respuesta.totalPrice).toBe(45000);
  });
});