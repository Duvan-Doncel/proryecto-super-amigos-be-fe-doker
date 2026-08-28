/**
 * Archivo: tests/helpers.ts
 * Descripción: Helpers reutilizables para los tests del backend.
 * ¿Para qué? Evitar repetir código de setup en cada archivo de tests.
 * ¿Impacto? Centralizar la creación de datos de prueba facilita el mantenimiento.
 */

import crypto from 'node:crypto';
import request from 'supertest';
import app from '../app.js';
import { db } from '../db/index.js';

// ¿Qué? Datos de cliente válido para reutilizar en múltiples tests.
export const TEST_USER = {
  documentId: '1000000001',
  firstName: 'Test',
  lastName: 'User',
  phone: '3001234567',
  email: 'test@groomingspa.com',
  password: 'Password1234',
};

// ¿Qué? Registra un cliente de prueba (email SIN verificar) y retorna el body.
// ¿Para qué? Tests que necesitan un usuario recién registrado antes de verificar email.
export async function createTestUser(
  overrides: Partial<typeof TEST_USER> = {},
): Promise<{ id: string; email: string }> {
  const userData = { ...TEST_USER, ...overrides };
  const res = await request(app).post('/api/v1/auth/register').send(userData);
  return res.body.data;
}

// ¿Qué? Registra un usuario y lo activa directamente en la BD (sin flujo de email).
// ¿Para qué? La mayoría de los tests necesitan un usuario listo para loguearse — este
//   helper evita tener que simular el envío/verificación de email en cada test.
// ¿Impacto? Método seguro para tests pues solo modifica la BD de pruebas aislada.
export async function createVerifiedTestUser(
  overrides: Partial<typeof TEST_USER> = {},
): Promise<{ id: string; email: string }> {
  const user = await createTestUser(overrides);
  // ¿Qué? Actualización directa en BD para simular la verificación de email.
  // ¿Para qué? Evitar dependencia del sistema de email en los tests de autenticación.
  await db.user.update({ where: { id: user.id }, data: { isEmailVerified: true } });
  return user;
}

// ¿Qué? Crea un usuario de staff ya verificado directamente en la BD.
// ¿Para qué? Tests de endpoints solo-staff (RF-008, y los que vendrán en próximos módulos)
//   necesitan una cuenta con role: 'staff' sin pasar por el flujo público de registro
//   (que solo crea clientes).
export async function createVerifiedStaffUser(
  overrides: Partial<{ email: string; password: string }> = {},
): Promise<{ id: string; email: string; password: string }> {
  const email = overrides.email ?? 'staff@groomingspa.com';
  const password = overrides.password ?? 'StaffPass123';
  const { hashPassword } = await import('../utils/security.js');

  const user = await db.user.create({
    data: {
      firstName: 'Staff',
      lastName: 'User',
      email,
      hashedPassword: await hashPassword(password),
      role: 'staff',
      isEmailVerified: true,
    },
  });

  return { id: user.id, email: user.email, password };
}

// ¿Qué? Crea un token de verificación de email directamente en la BD de tests.
// ¿Para qué? Testear el endpoint POST /verify-email sin depender del envío de emails.
// ¿Impacto? Permite verificar que el endpoint funciona con tokens válidos, expirados y usados.
export async function createVerificationToken(
  userId?: string,
  options: { expiresIn?: number; used?: boolean } = {},
): Promise<{ userId: string; token: string }> {
  let id = userId;
  if (!id) {
    const user = await createTestUser();
    id = user.id;
  }

  const token = crypto.randomBytes(32).toString('hex');
  // ¿Qué? expiresIn en milisegundos — por defecto 24 horas; negativo = ya expirado.
  const expiresAt = new Date(Date.now() + (options.expiresIn ?? 24 * 60 * 60 * 1000));

  await db.emailVerificationToken.create({
    data: {
      userId: id,
      token,
      expiresAt,
      used: options.used ?? false,
    },
  });

  return { userId: id, token };
}

// ¿Qué? Registra, verifica y loguea un cliente de prueba, retornando los tokens.
// ¿Para qué? Los tests de rutas protegidas necesitan un access token válido.
export async function loginTestUser(
  credentials: Partial<{ email: string; password: string }> = {},
): Promise<{ accessToken: string; refreshToken: string }> {
  await createVerifiedTestUser();
  const res = await request(app).post('/api/v1/auth/login').send({
    email: credentials.email ?? TEST_USER.email,
    password: credentials.password ?? TEST_USER.password,
  });
  return res.body.data;
}

// ¿Qué? Loguea una cuenta de staff de prueba, retornando los tokens.
// ¿Para qué? Los tests de endpoints solo-staff necesitan un access token con role: 'staff'.
export async function loginTestStaff(): Promise<{ accessToken: string; refreshToken: string }> {
  const staff = await createVerifiedStaffUser();
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: staff.email, password: staff.password });
  return res.body.data;
}
