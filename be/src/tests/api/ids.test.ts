/**
 * Archivo: tests/api/ids.test.ts
 * Descripción: Test UNITARIO de la regla isUuid (semana 6, capa Front, Santiago).
 * ¿Para qué? Fijar en su valor límite la regla que corrige el hallazgo de integración:
 *   un id que no es UUID hacía fallar a PostgreSQL y el API respondía 500.
 * ¿Impacto? Corre sin BD. El test de integración (pets.contrato-front.test.ts) queda como red.
 */

import { describe, it, expect } from "vitest";
import { isUuid } from "../../utils/ids.js";

const VALIDO = "3f2b8c1e-9a4d-4c7b-8e2f-1a2b3c4d5e6f";

describe("isUuid — valor límite", () => {
  it("acepta un UUID de 36 caracteres (en minúscula y en mayúscula)", () => {
    expect(isUuid(VALIDO)).toBe(true);
    expect(isUuid(VALIDO.toUpperCase())).toBe(true);
  });

  it("rechaza un carácter de menos (35) y uno de más (37)", () => {
    expect(isUuid(VALIDO.slice(0, -1))).toBe(false);
    expect(isUuid(`${VALIDO}0`)).toBe(false);
  });

  it("rechaza texto libre, vacío y un carácter que no es hexadecimal", () => {
    expect(isUuid("no-es-uuid")).toBe(false);
    expect(isUuid("")).toBe(false);
    expect(isUuid(`${VALIDO.slice(0, -1)}g`)).toBe(false);
  });
});
