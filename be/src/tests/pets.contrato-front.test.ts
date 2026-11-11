/**
 * Archivo: tests/pets.contrato-front.test.ts
 * Descripción: Semana 6 · capa Front (Santiago): ¿mienten los handlers de MSW de la semana 5?
 *   Se piden al backend REAL, contra la BD de pruebas, las mismas respuestas que el frontend
 *   simula con MSW (lista de mascotas, 401, 422, 404) y se comparan con lo que fingen los handlers.
 * ¿Para qué? Un handler de MSW es un doble: si no responde igual que el backend, los tests del
 *   frontend pasan con datos que nunca llegan en la vida real.
 * ¿Impacto? La conexión llega por DATABASE_URL (variable de entorno), nunca escrita aquí; si no
 *   está definida, el bloque se salta. Limpieza por truncado: setup.ts borra las tablas antes de
 *   CADA test, así que cada test crea su propio cliente y sus mascotas.
 */

import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.js";
import { db } from "../db/index.js";
import { generateAccessToken } from "../utils/security.js";

// ¿Qué? Crea un cliente verificado directo en la BD y devuelve su token de acceso.
// ¿Para qué? Cada test fabrica su propio dueño: sin ids fijos ni datos de otro test.
async function crearCliente(email: string) {
  const user = await db.user.create({
    data: {
      email,
      hashedPassword: "no-se-usa-en-este-test",
      firstName: "Cliente",
      lastName: "Front",
      role: "client",
      isEmailVerified: true,
    },
  });
  return {
    user,
    auth: {
      Authorization: `Bearer ${generateAccessToken(user.id, user.email, "client")}`,
    },
  };
}

describe.skipIf(!process.env.DATABASE_URL)(
  "Contrato real frente a los handlers de MSW (semana 6, capa Front)",
  () => {
    it("GET /pets/me: la mascota real trae más campos de los que finge el handler de MSW", async () => {
      // Arrange: una mascota con una condición de piel, guardada en la BD real
      const { user, auth } = await crearCliente("front1.s6@superamigos.test");
      await db.pet.create({
        data: {
          clientId: user.id,
          name: "Luna",
          species: "felina",
          size: "pequeno",
          weight: 4,
          skinConditions: { create: [{ type: "pulgas" }] },
        },
      });

      // Act
      const res = await request(app).get("/api/v1/pets/me").set(auth);

      // Assert: el handler de la semana 5 devolvía { id, name, species, skinConditions: [] }.
      //   El backend real además manda el dueño, la talla, el peso como número, la patología por
      //   DEFAULT de la tabla y cada condición de piel como objeto { type, note }.
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0]).toMatchObject({
        clientId: user.id,
        name: "Luna",
        species: "felina",
        size: "pequeno",
        weight: 4,
        pathology: "No aplica",
        photoUrl: null,
        skinConditions: [{ type: "pulgas", note: null }],
      });
    });

    it("POST /pets/me sin nombre: el 422 real es idéntico al que finge el handler de MSW", async () => {
      // Arrange
      const { user, auth } = await crearCliente("front2.s6@superamigos.test");

      // Act
      const res = await request(app)
        .post("/api/v1/pets/me")
        .set(auth)
        .send({ name: "", species: "felina", size: "pequeno", weight: 4 });

      // Assert: mismo cuerpo que el handler de la semana 5, y en la BD no quedó nada
      expect(res.status).toBe(422);
      expect(res.body).toEqual({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "name: El nombre de la mascota es requerido.",
        },
      });
      expect(await db.pet.count({ where: { clientId: user.id } })).toBe(0);
    });

    it("GET /pets/me con un token inválido: el 401 real es idéntico al del handler (dispara el refresh)", async () => {
      // Act
      const res = await request(app)
        .get("/api/v1/pets/me")
        .set({ Authorization: "Bearer token-viejo" });

      // Assert
      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Invalid or expired token" },
      });
    });

    it("DELETE /pets/me/:id con un UUID que no existe: 404 con el formato del contrato (caso nuevo para MSW)", async () => {
      // Arrange: el cliente tiene una mascota, pero pide borrar otra que no existe
      const { user, auth } = await crearCliente("front3.s6@superamigos.test");
      await db.pet.create({
        data: {
          clientId: user.id,
          name: "Toby",
          species: "canina",
          size: "mediano",
          weight: 12,
        },
      });

      // Act
      const res = await request(app)
        .delete("/api/v1/pets/me/3f2b8c1e-9a4d-4c7b-8e2f-1a2b3c4d5e6f")
        .set(auth);

      // Assert: 404 y la mascota del cliente sigue en la BD
      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        success: false,
        error: { code: "NOT_FOUND", message: "Mascota no encontrada." },
      });
      expect(await db.pet.count({ where: { clientId: user.id } })).toBe(1);
    });

    it("HALLAZGO: DELETE /pets/me/no-es-uuid respondía 500; ahora 404 y no borra nada", async () => {
      // Arrange
      const { user, auth } = await crearCliente("front4.s6@superamigos.test");
      await db.pet.create({
        data: {
          clientId: user.id,
          name: "Kira",
          species: "canina",
          size: "grande",
          weight: 30,
        },
      });

      // Act: la columna id es `uuid` en PostgreSQL; un texto cualquiera hacía fallar la consulta.
      //   En MySQL el id sería CHAR(36) y la consulta solo devolvería "no encontrado": este caso
      //   se comporta distinto según el motor y el repositorio falso nunca lo vio.
      const res = await request(app)
        .delete("/api/v1/pets/me/no-es-uuid")
        .set(auth);

      // Assert
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("NOT_FOUND");
      expect(await db.pet.count({ where: { clientId: user.id } })).toBe(1);
    });
  },
);
