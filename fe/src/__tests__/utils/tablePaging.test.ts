import { describe, expect, it } from 'vitest';
import { rowNumber } from '../../utils/tablePaging';

describe('rowNumber', () => {
  it('should number the first row of the first page as 1 (boundary)', () => {
    // Arrange
    const page = 1;
    const pageSize = 10;
    const index = 0;

    // Act
    const result = rowNumber(page, pageSize, index);

    // Assert
    expect(result).toBe(1);
  });

  it.each([
    [1, 10, 9, 10],  // última fila de la página 1
    [2, 10, 0, 11],  // primera fila de la página 2: continúa, no reinicia en 1
    [3, 5, 4, 15],   // otro tamaño de página
  ])('page %i, size %i, index %i should be row %i', (page, pageSize, index, expected) => {
    expect(rowNumber(page, pageSize, index)).toBe(expected);
  });
});