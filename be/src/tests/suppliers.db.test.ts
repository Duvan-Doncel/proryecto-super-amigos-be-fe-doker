    /**
     * Archivo: tests/suppliers.db.test.ts
     * Descripción: Tests de integración de la capa BD (semana 6) para proveedores (RF-020):
     *   el servicio de proveedores contra la base de datos REAL de pruebas (PostgreSQL).
     * ¿Para qué? Verificar lo que un repositorio falso (vi.mock) no puede ver: el orden real
     *   de la consulta, los valores por defecto de la tabla, la llave foránea con pedidos y
     *   cómo responde PostgreSQL a cada restricción de la tabla `suppliers`.
     * ¿Impacto? La conexión llega por DATABASE_URL (archivo .env.test), nunca escrita aquí.
     *   La limpieza es por truncado: setup.ts borra todas las tablas antes de cada test,
     *   así que cada test crea sus propios datos y no depende de otro.
     * Autor: Yesid Valencia
     */

    import { describe, it, expect } from 'vitest';
    import { Prisma } from '@prisma/client';
    import { db } from '../db/index.js';
    import {
    createSupplier,
    deleteSupplier,
    listSuppliers,
    updateSupplier,
    } from '../modules/suppliers/suppliers.service.js';

    // ¿Qué? Si no hay DATABASE_URL, todo el archivo se salta (no falla).
    // ¿Para qué? Que el CI siga en verde mientras la BD llega al CI en la semana 8.
    describe.skipIf(!process.env.DATABASE_URL)('Proveedores contra la BD real (semana 6, capa BD)', () => {
    // ─── Métodos del servicio ───────────────────────────────────────────────

    it('createSupplier guarda la fila en la BD con active=true y fecha de creación por defecto', async () => {
        // Arrange + Act
        const created = await createSupplier({ name: 'Agro Pet', email: 'ventas@agropet.com' });

        // Assert: se verifica EN LA BD, no solo en lo que devolvió la función.
        const row = await db.supplier.findUnique({ where: { id: created.id } });
        expect(row).not.toBeNull();
        expect(row!.name).toBe('Agro Pet');
        expect(row!.email).toBe('ventas@agropet.com');
        expect(row!.active).toBe(true); // DEFAULT true de la tabla
        expect(row!.createdAt).toBeInstanceOf(Date); // DEFAULT now() de la tabla
    });

    it('listSuppliers devuelve los proveedores ordenados por nombre (ORDER BY name)', async () => {
        // Arrange: se insertan a propósito en desorden.
        await db.supplier.create({ data: { name: 'Cuidado Total' } });
        await db.supplier.create({ data: { name: 'Agro Pet' } });
        await db.supplier.create({ data: { name: 'Bio Mascotas' } });

        // Act
        const list = await listSuppliers();

        // Assert: sin ORDER BY, PostgreSQL no garantiza ningún orden.
        expect(list.map((s) => s.name)).toEqual(['Agro Pet', 'Bio Mascotas', 'Cuidado Total']);
    });

    it('updateSupplier cambia los datos en la BD y responde 404 si el proveedor no existe', async () => {
        // Arrange
        const supplier = await db.supplier.create({ data: { name: 'Agro Pet' } });

        // Act
        await updateSupplier(supplier.id, { phone: '3001234567', active: false });

        // Assert
        const row = await db.supplier.findUnique({ where: { id: supplier.id } });
        expect(row!.phone).toBe('3001234567');
        expect(row!.active).toBe(false);
        await expect(updateSupplier('00000000-0000-0000-0000-000000000000', { name: 'Otro' })).rejects.toMatchObject({
        statusCode: 404,
        });
    });

    it('deleteSupplier borra de verdad al proveedor sin pedidos', async () => {
        // Arrange
        const supplier = await db.supplier.create({ data: { name: 'Agro Pet' } });

        // Act
        const result = await deleteSupplier(supplier.id);

        // Assert
        expect(result).toEqual({ softDeleted: false });
        expect(await db.supplier.findUnique({ where: { id: supplier.id } })).toBeNull();
    });

    it('deleteSupplier solo desactiva al proveedor que tiene pedidos (RN-202) y el pedido sigue ahí', async () => {
        // Arrange: proveedor con un pedido asociado (relación supplier_orders → suppliers).
        const supplier = await db.supplier.create({ data: { name: 'Agro Pet' } });
        const order = await db.supplierOrder.create({ data: { supplierId: supplier.id } });

        // Act
        const result = await deleteSupplier(supplier.id);

        // Assert
        expect(result).toEqual({ softDeleted: true });
        const row = await db.supplier.findUnique({ where: { id: supplier.id } });
        expect(row!.active).toBe(false);
        expect(await db.supplierOrder.findUnique({ where: { id: order.id } })).not.toBeNull();
    });

    // ─── Restricciones de la tabla (documentadas con un test cada una) ──────

    it('NOT NULL: la BD rechaza un proveedor sin nombre', async () => {
        await expect(db.$executeRaw`INSERT INTO suppliers (name) VALUES (NULL)`).rejects.toThrow(/null value/i);
    });

    it('LONGITUD: name es VARCHAR(150); 150 caracteres caben y 151 no', async () => {
        await expect(db.supplier.create({ data: { name: 'a'.repeat(150) } })).resolves.toBeDefined();

        const error = await db.supplier.create({ data: { name: 'a'.repeat(151) } }).catch((e: unknown) => e);
        expect(error).toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
        expect((error as Prisma.PrismaClientKnownRequestError).code).toBe('P2000'); // valor demasiado largo
    });

    it('LLAVE FORÁNEA: no se puede crear un pedido de un proveedor que no existe', async () => {
        const error = await db.supplierOrder
        .create({ data: { supplierId: '00000000-0000-0000-0000-000000000000' } })
        .catch((e: unknown) => e);
        expect((error as Prisma.PrismaClientKnownRequestError).code).toBe('P2003');
    });

    it('LLAVE FORÁNEA: la BD no deja borrar un proveedor con pedidos (por eso el servicio lo desactiva)', async () => {
        const supplier = await db.supplier.create({ data: { name: 'Agro Pet' } });
        await db.supplierOrder.create({ data: { supplierId: supplier.id } });

        const error = await db.supplier.delete({ where: { id: supplier.id } }).catch((e: unknown) => e);
        expect(error).toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
    });

    // ─── Hallazgo: diferencia PostgreSQL / MySQL ────────────────────────────

    it('HALLAZGO: un nombre con el carácter nulo (\\u0000) responde 422, no 500', async () => {
        // ¿Qué? PostgreSQL no guarda \u0000 en columnas de texto (MySQL sí). Antes de la
        //   regla en el servicio, el error de la BD llegaba al cliente como 500.
        await expect(createSupplier({ name: 'Agro\u0000Pet' })).rejects.toMatchObject({ statusCode: 422 });
        expect(await db.supplier.count()).toBe(0);
    });
    });