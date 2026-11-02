    /**
     * Archivo: tests/suppliers.rules.test.ts
     * Descripción: Test unitario de la regla del carácter nulo en proveedores (hallazgo S6).
     * ¿Para qué? Fijar el valor límite de la regla sin tocar la BD: un texto normal pasa y
     *   el mismo texto con un solo \u0000 se rechaza con 422.
     * Autor: Yesid Valencia
     */

    import { describe, it, expect } from 'vitest';
    import { assertNoNullCharacters } from '../modules/suppliers/suppliers.service.js';

    describe('assertNoNullCharacters (hallazgo semana 6)', () => {
    it.each([
        ['Agro Pet', true], // texto normal: pasa
        ['', true], // vacío: esta regla no lo rechaza (eso es del esquema)
        ['Agro\u0000Pet', false], // un solo carácter nulo en medio: se rechaza
        ['\u0000', false], // solo el carácter nulo (límite)
    ])('el nombre %j → permitido: %s', (name, allowed) => {
        const run = () => assertNoNullCharacters({ name });
        if (allowed) expect(run).not.toThrow();
        else expect(run).toThrow(expect.objectContaining({ statusCode: 422 }));
    });

    it('revisa todos los campos, no solo el nombre', () => {
        expect(() => assertNoNullCharacters({ name: 'Agro Pet', address: 'Calle 1\u0000' })).toThrow();
    });
    });