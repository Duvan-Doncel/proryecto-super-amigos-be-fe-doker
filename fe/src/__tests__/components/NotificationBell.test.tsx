/**
 * Archivo: __tests__/components/NotificationBell.test.tsx
 * Descripción: Tests de la campanita del staff con citas sin confirmar de hoy y de los
 *   próximos días.
 * ¿Para qué? Antes solo avisaba las citas de hoy; el staff no se enteraba con tiempo de
 *   las citas futuras pendientes de confirmar.
 */

import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { NotificationBell } from '@/components/layout/NotificationBell';
import { renderWithRouter } from '../helpers';
import type { AgendaAppointment } from '@/types/appointments';
import { notifyPendingChanged } from '@/utils/staffPending';

vi.mock('@/api/appointments');
vi.mock('@/api/symptom-reports');
vi.mock('@/api/orders');
vi.mock('@/api/products');
vi.mock('@/api/supplier-orders');
import * as appointmentsApi from '@/api/appointments';
import * as reportsApi from '@/api/symptom-reports';
import * as ordersApi from '@/api/orders';
import * as productsApi from '@/api/products';
import * as supplierOrdersApi from '@/api/supplier-orders';

function isoInDays(n: number): string {
  const t = new Date();
  const d = new Date(t.getFullYear(), t.getMonth(), t.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function appointment(id: string, time: string, petName: string): AgendaAppointment {
  return {
    id, time, status: 'pending',
    pet: { id: `pet-${id}`, name: petName },
    client: { id: 'c-1', firstName: 'Ana', lastName: 'Pérez', phone: null },
    service: { id: 's-1', name: 'Baño', durationMinutes: 60 },
  };
}

beforeEach(() => {
  vi.mocked(reportsApi.listPendingReports).mockResolvedValue([]);
  vi.mocked(ordersApi.listPendingOrders).mockResolvedValue([]);
  vi.mocked(productsApi.listProductsForStaff).mockResolvedValue({ products: [] } as never);
  vi.mocked(supplierOrdersApi.listSupplierOrders).mockResolvedValue([]);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('NotificationBell — citas sin confirmar', () => {
  it('avisa las de hoy y también las de los próximos días, cada una aparte', async () => {
    // Arrange — una cita hoy, otra mañana y otra en 3 días; una ya confirmada no cuenta.
    const byDay: Record<string, AgendaAppointment[]> = {
      [isoInDays(0)]: [appointment('a', '10:00:00', 'Luna')],
      [isoInDays(1)]: [appointment('b', '09:00:00', 'Max'), { ...appointment('x', '11:00:00', 'Toby'), status: 'confirmed' }],
      [isoInDays(3)]: [appointment('c', '15:30:00', 'Kira')],
    };
    vi.mocked(appointmentsApi.getAgenda).mockImplementation(async (d) => byDay[d ?? ''] ?? []);
    const user = userEvent.setup();
    renderWithRouter(<NotificationBell />);

    // Act
    await user.click(await screen.findByRole('button', { name: /notificaciones: 2 pendientes/i }));

    // Assert
    expect(screen.getByText('1 cita de hoy sin confirmar')).toBeInTheDocument();
    expect(screen.getByText('2 citas sin confirmar en los próximos 6 días')).toBeInTheDocument();
    expect(screen.getByText(/mañana 09:00 Max/)).toBeInTheDocument();
    expect(screen.queryByText(/Toby/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /próximos 6 días/ })).toHaveAttribute(
      'href',
      `/staff/agenda?fecha=${isoInDays(1)}`,
    );
    // Revisa de hoy hasta dentro de 6 días, y no más.
    expect(appointmentsApi.getAgenda).toHaveBeenCalledWith(isoInDays(6));
    expect(appointmentsApi.getAgenda).not.toHaveBeenCalledWith(isoInDays(7));
  });

  it('cuando el staff atiende algo, el contador se actualiza sin recargar la página', async () => {
    // Arrange — al entrar hay 1 cita de hoy sin confirmar.
    const pending = [appointment('a', '10:00:00', 'Luna')];
    vi.mocked(appointmentsApi.getAgenda).mockImplementation(async (d) => (d === isoInDays(0) ? pending : []));
    renderWithRouter(<NotificationBell />);
    expect(await screen.findByRole('button', { name: /notificaciones: 1 pendientes/i })).toBeInTheDocument();

    // Act — el staff la confirma en la agenda y la agenda avisa.
    pending.length = 0;
    act(() => notifyPendingChanged());

    // Assert
    expect(await screen.findByRole('button', { name: 'Notificaciones' })).toBeInTheDocument();
  });

  it('si no hay citas pendientes en la semana, no avisa de citas', async () => {
    // Arrange
    vi.mocked(appointmentsApi.getAgenda).mockResolvedValue([]);
    const user = userEvent.setup();
    renderWithRouter(<NotificationBell />);

    // Act
    await user.click(screen.getByRole('button', { name: 'Notificaciones' }));

    // Assert
    expect(await screen.findByText('Todo al día. No hay pendientes.')).toBeInTheDocument();
  });
});
