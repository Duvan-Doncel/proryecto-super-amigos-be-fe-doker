    /**
     * Archivo: tests/api/email.api.test.ts
     * Descripción: Tests de API con dobles (semana 5, capa API): el correo como dependencia externa.
     * ¿Para qué? Verificar que el backend llama al envío de correos con los datos correctos, que NO
     *   lo llama cuando no debe y que la app resiste si el servidor de correo (SMTP) falla.
     * ¿Impacto? Se reemplaza utils/email.ts (nuestra interfaz propia sobre nodemailer), nunca
     *   nodemailer directamente. La BD también se simula: no necesitan Docker ni Postgres.
     */

    import { describe, it, expect, vi, beforeEach } from "vitest";
    import request from "supertest";

    // ¿Qué? MOCK de nuestra interfaz de correo (utils/email.ts).
    // ¿Para qué? Ver con qué datos se llamó (comportamiento) sin enviar correos reales.
    vi.mock("../../utils/email.js", () => ({
    sendVerificationEmail: vi.fn(),
    sendPasswordResetEmail: vi.fn(),
    }));

    // ¿Qué? STUB de Prisma: devuelve datos fijos para que el flujo avance.
    vi.mock("../../db/index.js", () => ({
    db: {
        user: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
        emailVerificationToken: { create: vi.fn() },
        passwordResetToken: { create: vi.fn() },
    },
    }));

    import app from "../../app.js";
    import { db } from "../../db/index.js";
    import { sendPasswordResetEmail, sendVerificationEmail } from "../../utils/email.js";

    const dbMock = vi.mocked(db, true);
    const sendResetMock = vi.mocked(sendPasswordResetEmail);
    const sendVerificationMock = vi.mocked(sendVerificationEmail);

    const USER_ID = "11111111-1111-4111-8111-111111111111";

    // ¿Qué? Un usuario tal como lo devolvería Prisma.
    function fakeUser(overrides: Record<string, unknown> = {}) {
    return {
        id: USER_ID,
        documentId: "1234567890",
        firstName: "Yesid",
        lastName: "Valencia",
        phone: "3001234567",
        email: "yesid@test.com",
        hashedPassword: "hash",
        role: "client",
        isEmailVerified: false,
        createdAt: new Date("2026-11-01T12:00:00.000Z"),
        ...overrides,
    };
    }

    const registerBody = {
    documentId: "1234567890",
    firstName: "Yesid",
    lastName: "Valencia",
    phone: "3001234567",
    email: "yesid@test.com",
    password: "Clave1234",
    };

    beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    });

    describe("POST /api/v1/auth/register — correo de verificación", () => {
    it("should send the verification email to the new user with the saved token", async () => {
        // Doble: MOCK del correo (verificamos COMPORTAMIENTO: con qué se llamó).
        dbMock.user.findFirst.mockResolvedValue(null);
        dbMock.user.create.mockResolvedValue(fakeUser() as never);

        const res = await request(app).post("/api/v1/auth/register").send(registerBody);

        expect(res.status).toBe(201);
        const savedToken = dbMock.emailVerificationToken.create.mock.calls[0]![0].data.token;
        expect(sendVerificationMock).toHaveBeenCalledTimes(1);
        expect(sendVerificationMock).toHaveBeenCalledWith("yesid@test.com", savedToken);
    });

    it("should NOT send any email when the email is already registered", async () => {
        // Doble: STUB de la BD (ya existe el usuario) + MOCK del correo para ver que no se llamó.
        dbMock.user.findFirst.mockResolvedValue(fakeUser() as never);

        const res = await request(app).post("/api/v1/auth/register").send(registerBody);

        expect(res.status).toBe(409);
        expect(dbMock.user.create).not.toHaveBeenCalled();
        expect(sendVerificationMock).not.toHaveBeenCalled();
    });
    });

    describe("POST /api/v1/auth/forgot-password — correo de recuperación", () => {
    const genericBody = {
        success: true,
        message: "Si el email existe recibirás un enlace de recuperación en breve.",
    };

    it("should send the reset email with the same token that was saved", async () => {
        // Doble: MOCK del correo (COMPORTAMIENTO) + STUB de la BD (el usuario existe).
        dbMock.user.findUnique.mockResolvedValue(fakeUser() as never);

        const res = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({ email: "yesid@test.com" });

        expect(res.status).toBe(200);
        const savedToken = dbMock.passwordResetToken.create.mock.calls[0]![0].data.token;
        expect(savedToken).toMatch(/^[0-9a-f]{64}$/);
        expect(sendResetMock).toHaveBeenCalledWith("yesid@test.com", savedToken);
    });

    it("should NOT send any email when the email does not exist", async () => {
        // Doble: STUB de la BD (no hay usuario) + MOCK del correo para ver que no se llamó.
        dbMock.user.findUnique.mockResolvedValue(null);

        const res = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({ email: "nadie@test.com" });

        expect(res.status).toBe(200);
        expect(res.body).toEqual(genericBody);
        expect(dbMock.passwordResetToken.create).not.toHaveBeenCalled();
        expect(sendResetMock).not.toHaveBeenCalled();
    });

    it("should still answer 200 with the generic message when the mail server fails", async () => {
        // Doble: STUB del correo que FALLA (simula el SMTP caído). Verificamos ESTADO: la respuesta.
        // ¿Para qué? Si respondiera 500 solo cuando el email existe, un atacante sabría qué
        //   correos están registrados, y el usuario vería un error del servidor.
        dbMock.user.findUnique.mockResolvedValue(fakeUser() as never);
        sendResetMock.mockRejectedValue(new Error("connect ECONNREFUSED 127.0.0.1:1025"));

        const res = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({ email: "yesid@test.com" });

        expect(res.status).toBe(200);
        expect(res.body).toEqual(genericBody);
    });
    });