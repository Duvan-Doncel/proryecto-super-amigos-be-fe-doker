/**
 * Archivo: __tests__/components/Pagination.test.tsx
 * Descripción: Tests del componente de paginación reutilizable y del hook usePagination.
 * ¿Para qué? La paginación se usa en todas las tablas de la app — un bug aquí afecta a
 *   clientes, mascotas, citas, servicios, productos, historial, etc.
 */

import { render, screen, renderHook, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { Pagination } from '@/components/ui/Pagination';
import { usePagination } from '@/hooks/usePagination';

describe('Pagination', () => {
  it('no renderiza nada cuando no hay registros', () => {
    const { container } = render(
      <Pagination page={1} pageCount={1} total={0} pageSize={10} onPageChange={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('muestra el resumen "X–Y de N"', () => {
    render(<Pagination page={2} pageCount={5} total={42} pageSize={10} onPageChange={vi.fn()} itemNoun="citas" />);
    expect(screen.getByText('11–20 de 42 citas')).toBeInTheDocument();
  });

  it('marca la página activa con aria-current', () => {
    render(<Pagination page={3} pageCount={5} total={50} pageSize={10} onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: '3' })).toHaveAttribute('aria-current', 'page');
  });

  it('deshabilita "anterior" en la primera página y "siguiente" en la última', () => {
    const { rerender } = render(
      <Pagination page={1} pageCount={3} total={30} pageSize={10} onPageChange={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Página siguiente' })).toBeEnabled();

    rerender(<Pagination page={3} pageCount={3} total={30} pageSize={10} onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Página siguiente' })).toBeDisabled();
  });

  it('invoca onPageChange al hacer clic en un número de página', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination page={1} pageCount={5} total={50} pageSize={10} onPageChange={onPageChange} />);
    await user.click(screen.getByRole('button', { name: '2' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('muestra el selector de tamaño solo cuando se pasa onPageSizeChange', () => {
    const { rerender } = render(
      <Pagination page={1} pageCount={5} total={50} pageSize={10} onPageChange={vi.fn()} />,
    );
    expect(screen.queryByText('Por página')).not.toBeInTheDocument();

    rerender(
      <Pagination
        page={1}
        pageCount={5}
        total={50}
        pageSize={10}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    );
    expect(screen.getByText('Por página')).toBeInTheDocument();
  });
});

describe('usePagination', () => {
  it('corta la lista en páginas y expone el conteo correcto', () => {
    const items = Array.from({ length: 23 }, (_, i) => i);
    const { result } = renderHook(() => usePagination(items, 10));

    expect(result.current.pageCount).toBe(3);
    expect(result.current.total).toBe(23);
    expect(result.current.pageItems).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

    act(() => result.current.setPage(3));
    expect(result.current.pageItems).toEqual([20, 21, 22]);
  });

  it('vuelve a una página válida si la actual queda fuera de rango', () => {
    const { result, rerender } = renderHook(({ items }) => usePagination(items, 10), {
      initialProps: { items: Array.from({ length: 30 }, (_, i) => i) },
    });
    act(() => result.current.setPage(3));
    expect(result.current.page).toBe(3);

    // La lista se achica a 5 elementos (1 sola página)
    rerender({ items: [0, 1, 2, 3, 4] });
    expect(result.current.page).toBe(1);
    expect(result.current.pageItems).toEqual([0, 1, 2, 3, 4]);
  });

  it('cambiar el tamaño de página reinicia a la página 1', () => {
    const items = Array.from({ length: 50 }, (_, i) => i);
    const { result } = renderHook(() => usePagination(items, 10));
    act(() => result.current.setPage(4));
    act(() => result.current.setPageSize(25));
    expect(result.current.page).toBe(1);
    expect(result.current.pageItems).toHaveLength(25);
  });
});
