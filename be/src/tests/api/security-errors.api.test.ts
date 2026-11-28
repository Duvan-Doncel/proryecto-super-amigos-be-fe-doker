    /**
     * Archivo: tests/api/security-errors.api.test.ts
     * Descripción: Tests de API transversales (semana 4, capa E2E): seguridad y contrato de errores.
     * ¿Para qué? Fijar que los endpoints protegidos responden 401, 403 o 200 según el token, y que
     *   TODO error del API sale en JSON { success:false, error:{ code, message } } sin stack traces
     *   ni SQL: JSON mal formado, tipos incorrectos y errores inesperados de la BD.
     * ¿Impacto? La BD se simula con vi.mock: estos tests no necesitan Docker ni Postgres.
     */

    import { describe, it, expect, vi, beforeEach } from "vitest";
    import request from "supertest";

    // ¿Qué? Doble de Prisma — solo lo que usa GET /api/v1/suppliers.
    // ¿Para qué? Aislar la BD: router, middlewares de auth y manejador de errores son reales.
    vi.mock("../../db/index.js", () => ({
    db: {
        supplier: {
        findMany: vi.fn(),
        },
    },
    }));

    import app from "../../app.js";
    import { db } from "../../db/index.js";
    import { generateAccessToken } from "../../utils/security.js";

    const dbMock = vi.mocked(db, true);

    const clientToken = generateAccessToken(
    "11111111-1111-4111-8111-111111111111",
    "cliente@groomingspa.com",
    "client",
    );
    const staffToken = generateAccessToken(
    "33333333-3333-4333-8333-333333333333",
    "staff@groomingspa.com",
    "staff",
    );

    // ¿Qué? Señales de información interna que nunca deben llegar al cliente.
    function expectNoInternalDetails(text: string) {
    expect(text).not.toMatch(/\n\s+at /); // líneas de un stack trace
    expect(text).not.toMatch(/SELECT|INSERT|prisma/i);
    expect(text).not.toMatch(/<html|<pre>/i);
    }

    beforeEach(() => {
    vi.clearAllMocks();
    });

    describe("GET /api/v1/suppliers (solo staff)", () => {
    it("should respond 401 with JSON when there is no token", async () => {
        const res = await request(app).get("/api/v1/suppliers");

        expect(res.status).toBe(401);
        expect(res.headers["content-type"]).toMatch(/application\/json/);
        expect(res.body).toEqual({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Missing or invalid Authorization header" },
        });
        expect(dbMock.supplier.findMany).not.toHaveBeenCalled();
    });

    it("should respond 401 when the token is not valid", async () => {
        const res = await request(app)
        .get("/api/v1/suppliers")
        .set("Authorization", "Bearer token-falso");

        expect(res.status).toBe(401);
        expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("should respond 403 when a client tries to list suppliers", async () => {
        const res = await request(app)
        .get("/api/v1/suppliers")
        .set("Authorization", `Bearer ${clientToken}`);

        expect(res.status).toBe(403);
        expect(res.body.error.code).toBe("FORBIDDEN");
        expect(dbMock.supplier.findMany).not.toHaveBeenCalled();
    });

    it("should respond 200 with the list when the user is staff", async () => {
        dbMock.supplier.findMany.mockResolvedValue([] as never);

        const res = await request(app)
        .get("/api/v1/suppliers")
        .set("Authorization", `Bearer ${staffToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ success: true, data: [] });
    });

    it("should respond 500 without SQL nor stack trace when the database fails", async () => {
        dbMock.supplier.findMany.mockRejectedValue(
        new Error('Invalid prisma.supplier.findMany(): SELECT * FROM "suppliers" failed'),
        );
        vi.spyOn(console, "error").mockImplementation(() => {});

        const res = await request(app)
        .get("/api/v1/suppliers")
        .set("Authorization", `Bearer ${staffToken}`);

        expect(res.status).toBe(500);
        expect(res.body).toEqual({
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Internal server error" },
        });
        expectNoInternalDetails(res.text);
    });
    });

    describe("Contrato de errores del API", () => {
    it("should respond 400 with JSON detail when body is malformed JSON", async () => {
        const res = await request(app)
        .post("/api/v1/auth/login")
        .set("Content-Type", "application/json")
        .send('{"email":');

        expect(res.status).toBe(400);
        expect(res.headers["content-type"]).toMatch(/application\/json/);
        expect(res.body).toEqual({
        success: false,
        error: { code: "BAD_REQUEST", message: "El cuerpo de la petición no es un JSON válido." },
        });
        expectNoInternalDetails(res.text);
    });

    it("should respond 422 with JSON when a field has the wrong type", async () => {
        const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: 12345, password: true });

        expect(res.status).toBe(422);
        expect(res.headers["content-type"]).toMatch(/application\/json/);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe("VALIDATION_ERROR");
        expectNoInternalDetails(res.text);
    });

    it("should respond 404 with JSON when the route does not exist", async () => {
        const res = await request(app).get("/api/v1/no-existe");

        expect(res.status).toBe(404);
        expect(res.headers["content-type"]).toMatch(/application\/json/);
        expect(res.body).toEqual({
        success: false,
        error: { code: "NOT_FOUND", message: "Ruta no encontrada." },
        });
        expectNoInternalDetails(res.text);
    });
    });