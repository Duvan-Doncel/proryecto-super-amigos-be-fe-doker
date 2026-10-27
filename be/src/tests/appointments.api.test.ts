

    import request from 'supertest';
    import jwt from 'jsonwebtoken';
    import { beforeEach, describe, expect, it, vi } from 'vitest';
    import app from '../app.js';
    import { config } from '../config.js';
    import * as appointmentsService from '../modules/appointments/appointments.service.js';
    import { BadRequestError, NotFoundError } from '../middlewares/error.middleware.js';

    vi.mock('../modules/appointments/appointments.service.js');

    const CLIENT_ID = '11111111-1111-4111-8111-111111111111';
    const PET_ID = '22222222-2222-4222-8222-222222222222';
    const SERVICE_ID = '33333333-3333-4333-8333-333333333333';
    const APPOINTMENT_ID = '44444444-4444-4444-8444-444444444444';

    // ¿Qué? Firma un access token como lo haría el login, sin pasar por la BD.
    function tokenFor(role: 'client' | 'staff'): string {
    return jwt.sign(
        { sub: CLIENT_ID, email: `${role}@test.com`, role, type: 'access' },
        config.JWT_ACCESS_SECRET,
    );
    }

    const validBody = { petId: PET_ID, serviceId: SERVICE_ID, date: '2026-12-01', time: '10:00' };

    const fakeAppointment = { id: APPOINTMENT_ID, ...validBody, status: 'pending' };

    beforeEach(() => {
    vi.resetAllMocks();
    });

    describe('POST /api/v1/appointments', () => {
    it('should respond 201 with JSON and the created appointment', async () => {
        // Arrange
        vi.mocked(appointmentsService.createAppointment).mockResolvedValue(fakeAppointment as never);

        // Act
        const res = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${tokenFor('client')}`)
        .send(validBody);

        // Assert
        expect(res.status).toBe(201);
        expect(res.headers['content-type']).toMatch(/application\/json/);
        expect(res.body).toEqual({ success: true, data: fakeAppointment });
        expect(appointmentsService.createAppointment).toHaveBeenCalledWith(CLIENT_ID, validBody);
    });

    it('should respond 422 and not call the service when the time is invalid', async () => {
        const res = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${tokenFor('client')}`)
        .send({ ...validBody, time: '25:00' });

        expect(res.status).toBe(422);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('VALIDATION_ERROR');
        expect(res.body.error.message).toContain('La hora debe tener el formato HH:mm.');
        expect(appointmentsService.createAppointment).not.toHaveBeenCalled();
    });
    });

    describe('GET /api/v1/appointments/me', () => {
    it('should respond 200 with the appointments of the logged client', async () => {
        vi.mocked(appointmentsService.listMyAppointments).mockResolvedValue([fakeAppointment] as never);

        const res = await request(app)
        .get('/api/v1/appointments/me')
        .set('Authorization', `Bearer ${tokenFor('client')}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ success: true, data: [fakeAppointment] });
        expect(appointmentsService.listMyAppointments).toHaveBeenCalledWith(CLIENT_ID);
    });
    });

    describe('PUT /api/v1/appointments/:id', () => {
    it('should respond 404 when the appointment does not exist', async () => {
        vi.mocked(appointmentsService.updateAppointmentStatus).mockRejectedValue(
        new NotFoundError('Cita no encontrada.'),
        );

        const res = await request(app)
        .put(`/api/v1/appointments/${APPOINTMENT_ID}`)
        .set('Authorization', `Bearer ${tokenFor('staff')}`)
        .send({ status: 'confirmed' });

        expect(res.status).toBe(404);
        expect(res.body).toEqual({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Cita no encontrada.' },
        });
    });

    it('should respond 400 when the appointment is already in a final state', async () => {
        vi.mocked(appointmentsService.updateAppointmentStatus).mockRejectedValue(
        new BadRequestError('La cita ya está en estado final (cancelled) y no puede modificarse.'),
        );

        const res = await request(app)
        .put(`/api/v1/appointments/${APPOINTMENT_ID}`)
        .set('Authorization', `Bearer ${tokenFor('staff')}`)
        .send({ status: 'confirmed' });

        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('BAD_REQUEST');
    });

    it('should respond 422 when the status is not allowed', async () => {
        const res = await request(app)
        .put(`/api/v1/appointments/${APPOINTMENT_ID}`)
        .set('Authorization', `Bearer ${tokenFor('staff')}`)
        .send({ status: 'pending' });

        expect(res.status).toBe(422);
        expect(res.body.error.code).toBe('VALIDATION_ERROR');
        expect(appointmentsService.updateAppointmentStatus).not.toHaveBeenCalled();
    });
    });