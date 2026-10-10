/**
 * Archivo: modules/users/users.service.ts
 * Descripción: Lógica de negocio para operaciones sobre el perfil de usuario (RF-007).
 * ¿Para qué? Obtener los datos del usuario autenticado desde la BD de forma segura.
 * ¿Impacto? Solo expone datos propios — nunca datos de otros usuarios.
 */

import { db } from '../../db/index.js';
import { NotFoundError } from '../../middlewares/error.middleware.js';
import { logProfileUpdated } from '../../utils/audit-log.js';
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
  page: number;
  limit: number;
}

// ¿Qué? Lista clientes (role: 'client'), paginada y opcionalmente filtrada por texto.
// ¿Para qué? La pantalla "Clientes" del panel recorre todos los clientes; el buscador de
//   mascotas / ventas usa el mismo endpoint pasando `search` y se queda con la 1ª página.
// ¿Impacto? Nunca devuelve cuentas de staff.
export async function listClients({ search, hasPets, page, limit }: ListClientsParams): Promise<PaginatedClients> {
  const where = {
    role: 'client' as const,
    ...(search && {
      OR: [
        { email: { contains: search, mode: 'insensitive' as const } },
        { documentId: { contains: search, mode: 'insensitive' as const } },
        { firstName: { contains: search, mode: 'insensitive' as const } },
        { lastName: { contains: search, mode: 'insensitive' as const } },
      ],
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
    })),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}
