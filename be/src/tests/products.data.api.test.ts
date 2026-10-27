/**
 * Archivo: tests/products.data.api.test.ts
 * Descripción: Tests de API desde el ángulo de BD (semana 4, Juan): endpoints cuya respuesta
 *   cambia según lo que hay guardado — duplicados (409), relaciones (no borrar un producto con
 *   historial), búsquedas y filtros, e ids que la BD rechaza.
 * ¿Para qué? Probar el contrato HTTP (código, cuerpo y Content-Type) sin depender de los datos
 *   reales: el repositorio (cliente Prisma `db`) se reemplaza con vi.mock.
 * ¿Impacto? Ninguna petición de este archivo toca la BD; cada test decide qué "hay guardado".
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import { config } from '../config.js';
import { TEST_USER } from './helpers.js';

// ¿Qué? Repositorio simulado: solo los métodos de Prisma que usan estos endpoints.
// ¿Para qué? vi.hoisted lo crea antes que el vi.mock (que vitest sube al inicio del archivo).
const dbMock = vi.hoisted(() => ({
  product: {
    findMany: vi.fn(),
    count: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  user: {
    findFirst: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('../db/index.js', () => ({ db: dbMock }));

const PRODUCT_ID = '6f1c2b8e-3a4d-4f5e-9a7b-1c2d3e4f5a6b';

// ¿Qué? Token de staff firmado con el mismo secreto del API.
// ¿Para qué? authenticate solo verifica el JWT, así que no hace falta login ni BD.
const staffToken = jwt.sign(
  { sub: '0d9f8e7c-6b5a-4c3d-8e2f-1a0b9c8d7e6f', email: 'staff@groomingspa.com', role: 'staff', type: 'access' },
  config.JWT_ACCESS_SECRET,
);

function productRow(overrides: Record<string, unknown> = {}) {
  return {
    id: PRODUCT_ID,
    name: 'Shampoo avena',
    description: null,
    price: 25000,
    stock: 3,
    category: 'Higiene',
    active: true,
    createdAt: new Date('2026-10-01T10:00:00Z'),
    updatedAt: new Date('2026-10-01T10:00:00Z'),
    createdBy: null,
    updatedBy: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/v1/products (búsqueda y filtros)', () => {
  it('responde 200 en JSON y pasa la búsqueda, la categoría y el stock bajo al repositorio', async () => {
    dbMock.product.findMany.mockResolvedValue([productRow()]);
    dbMock.product.count.mockResolvedValue(1);

    const res = await request(app).get('/api/v1/products?search=shampoo&category=higiene&lowStock=true');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toEqual({
      success: true,
      data: [expect.objectContaining({ id: PRODUCT_ID, name: 'Shampoo avena', stock: 3 })],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
    // El listado público solo muestra activos, y los filtros llegan sin distinguir mayúsculas.
    expect(dbMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          active: true,
          category: { contains: 'higiene', mode: 'insensitive' },
          name: { contains: 'shampoo', mode: 'insensitive' },
          stock: { lte: 5 },
        },
      }),
    );
  });
});

describe('DELETE /api/v1/products/:id (relaciones)', () => {
  it('no borra un producto con ventas: lo desactiva y responde softDeleted true', async () => {
    dbMock.product.findUnique.mockResolvedValue(
      productRow({ _count: { orderItems: 0, saleItems: 2, supplierOrderItems: 0 } }),
    );
    dbMock.product.update.mockResolvedValue(productRow({ active: false }));

    const res = await request(app)
      .delete(`/api/v1/products/${PRODUCT_ID}`)
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: { softDeleted: true } });
    expect(dbMock.product.update).toHaveBeenCalledWith({ where: { id: PRODUCT_ID }, data: { active: false } });
    expect(dbMock.product.delete).not.toHaveBeenCalled();
  });

  it('responde 404 en JSON cuando el producto no existe', async () => {
    dbMock.product.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .delete(`/api/v1/products/${PRODUCT_ID}`)
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toEqual({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Producto no encontrado.' },
    });
  });

  it('responde 404 (no 500) cuando la BD rechaza un id que no es UUID', async () => {
    // ¿Qué? Así responde Prisma con Postgres a `where: { id: 'no-es-uuid' }` en una columna uuid.
    const prismaError = Object.assign(new Error('invalid input syntax for type uuid: "no-es-uuid"'), {
      name: 'PrismaClientKnownRequestError',
      code: 'P2007',
    });
    dbMock.product.findUnique.mockRejectedValue(prismaError);

    const res = await request(app)
      .delete('/api/v1/products/no-es-uuid')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Recurso no encontrado.' },
    });
    // El cuerpo no filtra el detalle de la BD.
    expect(JSON.stringify(res.body)).not.toMatch(/uuid|syntax|prisma/i);
  });
});

describe('POST /api/v1/auth/register (duplicados)', () => {
  it('responde 409 con mensaje genérico y no crea el usuario si el email o el documento ya existen', async () => {
    dbMock.user.findFirst.mockResolvedValue({ id: 'u-1', email: TEST_USER.email });

    const res = await request(app).post('/api/v1/auth/register').send(TEST_USER);

    expect(res.status).toBe(409);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toEqual({
      success: false,
      error: { code: 'CONFLICT', message: 'El email o el documento ya están registrados.' },
    });
    expect(dbMock.user.create).not.toHaveBeenCalled();
  });
});
