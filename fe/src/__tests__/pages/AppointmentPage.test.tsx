/**
 * Archivo: __tests__/pages/AppointmentPage.test.tsx
 * Descripción: Tests de componente de la página de agendar cita (RF-009, RF-014, RF-010).
 */

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { AppointmentPage } from '@/pages/client/AppointmentPage';
import { renderWithRouter } from '../helpers';
import type { Pet } from '@/types/pets';

// ¿Qué? Reemplazar los módulos del cliente HTTP — el test nunca llama al API real.
vi.mock('@/api/pets');
vi.mock('@/api/services');
vi.mock('@/api/appointments');
import * as petsApi from '@/api/pets';
import * as servicesApi from '@/api/services';
import * as appointmentsApi from '@/api/appointments';

const pet: Pet = {
  id: 'pet-1', clientId: 'user-test-id-1', name: 'Luna', species: 'canina',
  breed: null, gender: null, age: 3, weight: 8, color: null, size: null,
  coatType: null, behavior: null, skinConditions: [], pathology: '',
  photoUrl: null, createdAt: '2026-01-01T00:00:00Z',
};

const service = {
  id: 'svc-1', name: 'Baño completo', description: null, price: 50000,
  durationMinutes: 60, active: true, createdAt: '2026-01-01T00:00:00Z',
};

const quote = {
  serviceId: 'svc-1', serviceName: 'Baño completo', petId: 'pet-1', petName: 'Luna',
  base: 50000, lines: [], total: 50000, blocked: false, blockingConditions: [],
};

beforeEach(() => {
  vi.mocked(petsApi.listMyPets).mockResolvedValue([pet]);
  vi.mocked(servicesApi.listServices).mockResolvedValue([service]);
  vi.mocked(appointmentsApi.listMyAppointments).mockResolvedValue([]);
  vi.mocked(appointmentsApi.getAvailability).mockResolvedValue({ capacity: 8, days: [] });
  vi.mocked(appointmentsApi.quoteAppointment).mockResolvedValue(quote);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('AppointmentPage', () => {
  it('muestra las citas del cliente con el nombre de la mascota y del servicio', async () => {
    // Arrange
    vi.mocked(appointmentsApi.listMyAppointments).mockResolvedValue([
      {
        id: 'apt-1', clientId: 'user-test-id-1', petId: 'pet-1', serviceId: 'svc-1',
        date: '2026-11-03', time: '10:00', status: 'pending', notes: null,
        totalPrice: null, priceBreakdown: null, createdAt: '2026-10-24T00:00:00Z',
      },
    ]);

    // Act
    renderWithRouter(<AppointmentPage />);

    // Assert — findBy porque la cita llega después de que el API responde.
    expect(await screen.findByText('2026-11-03 — 10:00 — Baño completo (Luna)')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
    expect(screen.queryByText(/todavía no tienes citas/i)).not.toBeInTheDocument();
  });

  it('muestra el estado vacío cuando el cliente no tiene citas', async () => {
    // Arrange + Act
    renderWithRouter(<AppointmentPage />);

    // Assert — esperamos a que el API responda antes de revisar la pantalla.
    await waitFor(() => expect(appointmentsApi.listMyAppointments).toHaveBeenCalled());
    expect(screen.getByText('Todavía no tienes citas agendadas.')).toBeInTheDocument();
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });

    it('al elegir mascota y servicio muestra el precio estimado', async () => {
    // Arrange
    const user = userEvent.setup();
    renderWithRouter(<AppointmentPage />);
    await screen.findByRole('option', { name: 'Luna' });

    // Act — el usuario elige en los selects, buscados por su etiqueta.
    await user.selectOptions(screen.getByLabelText('Mascota'), 'Luna');
    await user.selectOptions(screen.getByLabelText('Servicio'), 'svc-1');

    // Assert
    expect(await screen.findByText('Precio estimado — Luna')).toBeInTheDocument();
    expect(screen.getByText('Total estimado')).toBeInTheDocument();
    expect(appointmentsApi.quoteAppointment).toHaveBeenCalledWith('pet-1', 'svc-1');
  });

    it('bloquea el agendamiento si la mascota necesita revisión antes del baño', async () => {
    // Arrange — el API responde que la mascota está bloqueada.
    vi.mocked(appointmentsApi.quoteAppointment).mockResolvedValue({
      ...quote,
      blocked: true,
      blockingConditions: ['dermatitis'],
    });
    const user = userEvent.setup();
    renderWithRouter(<AppointmentPage />);
    await screen.findByRole('option', { name: 'Luna' });

    // Act
    await user.selectOptions(screen.getByLabelText('Mascota'), 'Luna');
    await user.selectOptions(screen.getByLabelText('Servicio'), 'svc-1');

    // Assert — sale el aviso con el enlace al reporte de síntoma y NO el precio.
    expect(await screen.findByText('Luna necesita una revisión antes de un baño')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /reportar un síntoma/i })).toHaveAttribute('href', '/app/sintoma');
    expect(screen.queryByText('Total estimado')).not.toBeInTheDocument();
  });

  // (aquí van los siguientes tests)
});