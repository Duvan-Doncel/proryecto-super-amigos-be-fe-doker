/**
 * Archivo: modules/appointments/appointments.service.ts
 * Descripción: Lógica de negocio de las citas de grooming — opción verde del semáforo (RF-009).
 * ¿Para qué? Validar las reglas de negocio (mascota propia, antelación mínima, horario de
 *   atención, servicio activo) antes de crear una cita.
 * ¿Impacto? Es el flujo de negocio principal de GroomingSpa.
 */

import type { Appointment } from '@prisma/client';
import { db } from '../../db/index.js';
import { NotFoundError, BadRequestError } from '../../middlewares/error.middleware.js';
import { assertPetBelongsToClient } from '../pets/pets.service.js';
import type { CreateAppointmentInput, UpdateAppointmentStatusInput } from './appointments.schema.js';

export interface AppointmentResponse {
  id: string;
  clientId: string;
  petId: string;
  serviceId: string;
  date: string;
  time: string;
  status: string;
  notes: string | null;
  createdAt: Date;
}

function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function toAppointmentResponse(appt: Appointment): AppointmentResponse {
  return {
    id: appt.id,
    clientId: appt.clientId,
    petId: appt.petId,
    serviceId: appt.serviceId,
    date: toDateOnly(appt.date),
    time: appt.time,
    status: appt.status,
    notes: appt.notes,
    createdAt: appt.createdAt,
  };
}

// ¿Qué? Calcula la fecha mínima permitida (mañana, a partir de hoy) en formato AAAA-MM-DD.
// ¿Para qué? Aplicar RN-092: "la cita debe ser a partir de mañana".
function minimumAllowedDate(): string {
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return toDateOnly(tomorrow);
}

// ¿Qué? Convierte "HH:mm" a minutos desde medianoche, para comparar contra el horario de atención.
function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h! * 60 + m!;
}

const OPENING_MINUTES = 9 * 60; // 9:00 a.m.
const CLOSING_MINUTES = 18 * 60; // 6:00 p.m.

// ¿Qué? Agenda una cita de grooming para el cliente autenticado (RF-009).
// ¿Para qué? Aplica, en orden, todas las reglas de negocio del RF antes de insertar.
export async function createAppointment(
  clientId: string,
  data: CreateAppointmentInput,
): Promise<AppointmentResponse> {
  // RN-091: la mascota debe existir y pertenecer al cliente autenticado.
  await assertPetBelongsToClient(data.petId, clientId);

  // RN-092: la cita debe ser, como mínimo, para el día siguiente a hoy.
  if (data.date < minimumAllowedDate()) {
    throw new BadRequestError('La cita debe ser a partir de mañana, no se permite hoy ni fechas anteriores.');
  }

  // RN-093: la hora debe estar dentro del horario de atención (9:00 a.m. - 6:00 p.m.).
  const minutes = toMinutes(data.time);
  if (minutes < OPENING_MINUTES || minutes > CLOSING_MINUTES) {
    throw new BadRequestError('La hora debe estar entre las 9:00am y las 6:00pm.');
  }

  // RN-094: el servicio debe existir y estar activo.
  const service = await db.service.findUnique({ where: { id: data.serviceId } });
  if (!service || !service.active) {
    throw new NotFoundError('Servicio no encontrado o inactivo.');
  }

  const appointment = await db.appointment.create({
    data: {
      clientId,
      petId: data.petId,
      serviceId: data.serviceId,
      date: new Date(`${data.date}T00:00:00.000Z`),
      time: data.time,
      notes: data.notes,
    },
  });

  return toAppointmentResponse(appointment);
}

// ¿Qué? Lista las citas del cliente autenticado, más recientes primero.
export async function listMyAppointments(clientId: string): Promise<AppointmentResponse[]> {
  const appointments = await db.appointment.findMany({
    where: { clientId },
    orderBy: [{ date: 'desc' }, { time: 'desc' }],
  });
  return appointments.map(toAppointmentResponse);
}

// ¿Qué? Forma enriquecida de una cita para la agenda del staff (RF-017) — incluye los
//   datos de mascota, cliente y servicio que el staff necesita ver de un vistazo.
export interface AgendaAppointmentResponse {
  id: string;
  time: string;
  status: string;
  pet: { id: string; name: string };
  client: { id: string; firstName: string; lastName: string; phone: string | null };
  service: { id: string; name: string; durationMinutes: number };
}

// ¿Qué? Lista las citas de un día específico, para el calendario del staff (RF-017).
// ¿Para qué? Ordenadas por hora, con los datos necesarios para atender sin consultas extra.
export async function listAgendaByDate(date: string): Promise<AgendaAppointmentResponse[]> {
  const appointments = await db.appointment.findMany({
    where: { date: new Date(`${date}T00:00:00.000Z`) },
    orderBy: { time: 'asc' },
    include: { pet: true, client: true, service: true },
  });

  return appointments.map((a) => ({
    id: a.id,
    time: a.time,
    status: a.status,
    pet: { id: a.pet.id, name: a.pet.name },
    client: { id: a.client.id, firstName: a.client.firstName, lastName: a.client.lastName, phone: a.client.phone },
    service: { id: a.service.id, name: a.service.name, durationMinutes: a.service.durationMinutes },
  }));
}

// ¿Qué? Cambia el estado de una cita — solo el staff puede hacerlo (RF-017, RN-096/097).
export async function updateAppointmentStatus(
  id: string,
  data: UpdateAppointmentStatusInput,
): Promise<AppointmentResponse> {
  const existing = await db.appointment.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Cita no encontrada.');

  // RN-097 (parcial): un estado final (completed/cancelled) no puede volver a moverse.
  if (existing.status === 'completed' || existing.status === 'cancelled') {
    throw new BadRequestError(`La cita ya está en estado final (${existing.status}) y no puede modificarse.`);
  }

  const updated = await db.appointment.update({ where: { id }, data: { status: data.status } });
  return toAppointmentResponse(updated);
}
