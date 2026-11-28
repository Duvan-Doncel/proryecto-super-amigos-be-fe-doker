/**
 * Archivo: __tests__/components/ProductCategoryField.test.tsx
 * Descripción: Tests del campo de categoría de productos (lista fija con filtro).
 * ¿Para qué? Verificar que el staff elige la categoría de la lista y que el filtro
 *   va dejando solo las que se parecen a lo que escribe.
 */

import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BreedCombobox } from '@/components/ui/BreedCombobox';
import { PRODUCT_CATEGORIES } from '@/data/productCategories';

function CategoryField({ onPick }: { onPick: (v: string) => void }) {
  const [value, setValue] = useState('');
  return (
    <BreedCombobox
      id="category"
      name="category"
      label="Categoría"
      value={value}
      onChange={(v) => {
        setValue(v);
        onPick(v);
      }}
      options={[...PRODUCT_CATEGORIES]}
      emptyMessage={(t) => `Ninguna categoría coincide con “${t}”.`}
      helpText="Elige una categoría de la lista."
    />
  );
}

describe('Campo de categoría de productos', () => {
  it('al abrirlo muestra las 12 categorías', async () => {
    const user = userEvent.setup();
    render(<CategoryField onPick={() => {}} />);

    await user.click(screen.getByLabelText('Categoría'));

    expect(screen.getAllByRole('option')).toHaveLength(12);
  });

  it('al escribir se filtra y al elegir guarda la categoría exacta', async () => {
    const user = userEvent.setup();
    const picked: string[] = [];
    render(<CategoryField onPick={(v) => picked.push(v)} />);

    await user.type(screen.getByLabelText('Categoría'), 'ju');

    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Juguetes']);
    await user.click(screen.getByRole('option', { name: 'Juguetes' }));
    expect(picked.at(-1)).toBe('Juguetes');
  });

  it('si nada coincide, lo dice en vez de dejar escribir cualquier cosa', async () => {
    const user = userEvent.setup();
    render(<CategoryField onPick={() => {}} />);

    await user.type(screen.getByLabelText('Categoría'), 'medicamento');

    expect(screen.getByText('Ninguna categoría coincide con “Medicamento”.')).toBeInTheDocument();
  });
});
