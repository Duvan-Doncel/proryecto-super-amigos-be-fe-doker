/**
 * Archivo: modules/users/users.service.ts
 * Descripción: Lógica de negocio para operaciones sobre el perfil de usuario (RF-007).
 * ¿Para qué? Obtener los datos del usuario autenticado desde la BD de forma segura.
 * ¿Impacto? Solo expone datos propios — nunca datos de otros usuarios.
 */

import { z } from 'zod';
import { db } from '../../db/index.js';
import { ConflictError, NotFoundError } from '../../middlewares/error.middleware.js';
import { logClientDeactivated, logClientReactivated, logProfileUpdated } from '../../utils/audit-log.js';
import type { UpdateProfileInput } from './users.schema.js';

// ¿Qué? DTO de perfil de usuario — omite hashedPassword.
export interface UserProfile {
  id: string;
  documentId: string | null;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string;
  role: 'client' | 'staff';
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date | null;
}

// ¿Qué? Obtiene el perfil del usuario por su ID.
// ¿Para qué? Servir el endpoint GET /api/v1/users/me con datos propios del token.
// ¿Impacto? El ID siempre viene del token JWT — nunca de un parámetro de ruta controlable
//   por el cliente, lo que previene acceso horizontal no autorizado (IDOR, RN-073).
export async function getUserById(userId: string): Promise<UserProfile> {
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) throw new NotFoundError('Usuario no encontrado.');

  return {
    id: user.id,
    documentId: user.documentId,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    email: user.email,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

// ¿Qué? Actualiza los datos que el propio usuario puede cambiar: nombre, apellido, teléfono.
// ¿Para qué? Servir PUT /api/v1/users/me. El email, el documento y el rol NO son editables
//   por esta vía (el email requiere re-verificación; documento y rol los gestiona el staff).
// ¿Impacto? El ID viene del token — un usuario solo puede editar su propio perfil.
export async function updateProfile(userId: string, data: UpdateProfileInput): Promise<UserProfile> {
  const exists = await db.user.findUnique({ where: { id: userId } });
  if (!exists) throw new NotFoundError('Usuario no encontrado.');

  const user = await db.user.update({
    where: { id: userId },
    data: {
      ...(data.firstName !== undefined && { firstName: data.firstName }),
      ...(data.lastName !== undefined && { lastName: data.lastName }),
      ...(data.phone !== undefined && { phone: data.phone }),
      // ¿Qué? `updatedAt` no es @updatedAt en el schema — se fija a mano.
      updatedAt: new Date(),
    },
  });

  logProfileUpdated(userId, Object.keys(data));

  return {
    id: user.id,
    documentId: user.documentId,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    email: user.email,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

// ¿Qué? Resumen de un cliente para el panel de staff — sin hash de contraseña.
//   Incluye `createdAt` ("cliente desde") y `petCount` (mascotas registradas) para que la
//   pantalla "Clientes" muestre información útil de un vistazo.
export interface ClientSummary {
  id: string;
  documentId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  createdAt: Date;
  petCount: number;
  // ¿Qué? Datos de la baja — null si el cliente está activo.
  deactivatedAt: Date | null;
  deactivationReason: string | null;
}

export interface PaginatedClients {
  data: ClientSummary[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ListClientsParams {
  search?: string;
  hasPets?: 'true' | 'false';
  status?: 'active' | 'inactive' | 'all';
  page: number;
  limit: number;
}

// ¿Qué? Lista clientes (role: 'client'), paginada y opcionalmente filtrada por texto.
// ¿Para qué? La pantalla "Clientes" del panel recorre todos los clientes; el buscador de
//   mascotas / ventas usa el mismo endpoint pasando `search` y se queda con la 1ª página.
// ¿Impacto? Nunca devuelve cuentas de staff.
export async function listClients({
  search,
  hasPets,
  status = 'active',
  page,
  limit,
}: ListClientsParams): Promise<PaginatedClients> {
  // ¿Qué? La búsqueda se parte en palabras y CADA palabra debe aparecer en algún campo
  //   (nombre, apellido, correo o documento).
  // ¿Para qué? Antes se buscaba el texto completo en cada campo por separado, así que
  //   "Alvaro Espejo" no encontraba a nadie (el nombre es "Alvaro" y el apellido "Espejo").
  //   Ahora cada palabra filtra más: "Alvaro" trae a todos los Alvaro y "Alvaro Espejo" deja
  //   solo a ese. El orden no importa ("Espejo Alvaro") y sirven palabras parciales.
  // ¿Impacto? Máximo 5 palabras, para que una búsqueda larga no arme una consulta enorme.
  const words = (search ?? '').split(/\s+/).filter(Boolean).slice(0, 5);
  const where = {
    role: 'client' as const,
    ...(status === 'active' && { deactivatedAt: null }),
    ...(status === 'inactive' && { deactivatedAt: { not: null } }),
    ...(words.length > 0 && {
      AND: words.map((word) => ({
        OR: [
          { email: { contains: word, mode: 'insensitive' as const } },
          { documentId: { contains: word, mode: 'insensitive' as const } },
          { firstName: { contains: word, mode: 'insensitive' as const } },
          { lastName: { contains: word, mode: 'insensitive' as const } },
        ],
      })),
    }),
    ...(hasPets === 'true' && { pets: { some: {} } }),
    ...(hasPets === 'false' && { pets: { none: {} } }),
  };

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      include: { _count: { select: { pets: true } } },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    }),
    db.user.count({ where }),
  ]);

  return {
    data: users.map((u) => ({
      id: u.id,
      documentId: u.documentId,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      phone: u.phone,
      createdAt: u.createdAt,
      petCount: u._count.pets,
      deactivatedAt: u.deactivatedAt,
      deactivationReason: u.deactivationReason,
    })),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

// ─────────────── Baja y reactivación de clientes ───────────────

export interface ClientStatusResult {
  id: string;
  deactivatedAt: Date | null;
  deactivationReason: string | null;
  // ¿Qué? Lo que se canceló al dar de baja (0 al reactivar).
  cancelledAppointments: number;
  cancelledOrders: number;
}

// ¿Qué? Busca un CLIENTE por id; si el id no es un UUID o es de un staff, responde 404.
// ¿Para qué? Un id mal formado haría fallar la consulta con 500, y esta ruta nunca debe
//   poder dar de baja una cuenta de staff.
async function findClientOrThrow(clientId: string) {
  if (!z.string().uuid().safeParse(clientId).success) throw new NotFoundError('Cliente no encontrado.');
  const user = await db.user.findUnique({ where: { id: clientId } });
  if (!user || user.role !== 'client') throw new NotFoundError('Cliente no encontrado.');
  return user;
}

// ¿Qué? Da de baja a un cliente (borrado lógico).
// ¿Para qué? El cliente "se fue": ya no puede entrar ni aparece en la lista activa, pero su
//   historial (citas pasadas, pedidos entregados, ventas) se conserva tal cual.
// ¿Impacto? En una sola transacción:
//   1. marca la fecha y el motivo de la baja;
//   2. cancela sus citas de hoy en adelante que sigan pendientes o confirmadas (liberan cupo);
//   3. cancela sus pedidos pendientes y devuelve el stock reservado (RN-192).
//   El login y la renovación de sesión de una cuenta dada de baja se rechazan (auth.service).
export async function deactivateClient(
  staffId: string,
  clientId: string,
  reason?: string,
): Promise<ClientStatusResult> {
  const client = await findClientOrThrow(clientId);
  if (client.deactivatedAt) throw new ConflictError('Este cliente ya fue dado de baja.');

  const now = new Date();
  const todayUtc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

  const result = await db.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: clientId },
      data: { deactivatedAt: now, deactivationReason: reason ?? null, updatedAt: now },
    });

    const appointments = await tx.appointment.updateMany({
      where: { clientId, date: { gte: todayUtc }, status: { in: ['pending', 'confirmed'] } },
      data: { status: 'cancelled', updatedAt: now },
    });

    const pendingOrders = await tx.order.findMany({
      where: { clientId, status: 'pending' },
      include: { items: true },
    });
    for (const order of pendingOrders) {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
      await tx.order.update({ where: { id: order.id }, data: { status: 'cancelled' } });
    }

    return {
      id: updated.id,
      deactivatedAt: updated.deactivatedAt,
      deactivationReason: updated.deactivationReason,
      cancelledAppointments: appointments.count,
      cancelledOrders: pendingOrders.length,
    };
  });

  logClientDeactivated(staffId, clientId);
  return result;
}

// ¿Qué? Reactiva a un cliente dado de baja (por error, o porque volvió).
// ¿Impacto? Solo devuelve el acceso: las citas y pedidos cancelados en la baja no se
//   restauran — el cliente agenda de nuevo.
export async function reactivateClient(staffId: string, clientId: string): Promise<ClientStatusResult> {
  const client = await findClientOrThrow(clientId);
  if (!client.deactivatedAt) throw new ConflictError('Este cliente ya está activo.');

  const updated = await db.user.update({
    where: { id: clientId },
    data: { deactivatedAt: null, deactivationReason: null, updatedAt: new Date() },
  });

  logClientReactivated(staffId, clientId);
  return {
    id: updated.id,
    deactivatedAt: null,
    deactivationReason: null,
    cancelledAppointments: 0,
    cancelledOrders: 0,
  };
}
