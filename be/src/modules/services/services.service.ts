/**
 * Archivo: modules/services/services.service.ts
 * Descripción: Lógica de negocio del catálogo de servicios de grooming (RF-014).
 * ¿Para qué? Permitir que el staff administre servicios y precios sin tocar código —
 *   los precios se revisan cada año (RN de restricciones.md).
 * ¿Impacto? El catálogo activo lo consume el cliente al agendar una cita (RF-009).
 */

import type { Service } from '@prisma/client';
import { db } from '../../db/index.js';
import { NotFoundError } from '../../middlewares/error.middleware.js';
import type { CreateServiceInput, UpdateServiceInput } from './services.schema.js';

export interface ServiceResponse {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationMinutes: number;
  active: boolean;
  createdAt: Date;
}

function toServiceResponse(service: Service): ServiceResponse {
  return {
    id: service.id,
    name: service.name,
    description: service.description,
    price: Number(service.price),
    durationMinutes: service.durationMinutes,
    active: service.active,
    createdAt: service.createdAt,
  };
}

// ¿Qué? Lista servicios — por defecto solo los activos (RN-144), salvo que el caller
//   pida explícitamente los inactivos (uso exclusivo del staff, RN-145).
export async function listServices(activeOnly = true): Promise<ServiceResponse[]> {
  const services = await db.service.findMany({
    where: activeOnly ? { active: true } : undefined,
    orderBy: { name: 'asc' },
  });
  return services.map(toServiceResponse);
}

export async function createService(data: CreateServiceInput): Promise<ServiceResponse> {
  const service = await db.service.create({ data });
  return toServiceResponse(service);
}

export async function updateService(
  id: string,
  data: UpdateServiceInput,
): Promise<ServiceResponse> {
  const existing = await db.service.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Servicio no encontrado.');

  const updated = await db.service.update({ where: { id }, data });
  return toServiceResponse(updated);
}

// ¿Qué? "Elimina" un servicio — si tiene citas asociadas, lo desactiva en vez de
//   borrarlo (RN-143), para no perder el historial de citas que lo referencian.
export async function deleteService(id: string): Promise<{ softDeleted: boolean }> {
  const existing = await db.service.findUnique({
    where: { id },
    include: { _count: { select: { appointments: true } } },
  });
  if (!existing) throw new NotFoundError('Servicio no encontrado.');

  if (existing._count.appointments > 0) {
    await db.service.update({ where: { id }, data: { active: false } });
    return { softDeleted: true };
  }

  await db.service.delete({ where: { id } });
  return { softDeleted: false };
}
