/**
 * Archivo: data/productCategories.ts
 * Descripción: Categorías de la tienda — las 12 más comunes en una tienda de mascotas.
 * ¿Para qué? Que el staff elija la categoría de una lista en vez de escribirla, así no
 *   quedan repetidas con otra forma ("Juguete", "juguetes", "Juguetes").
 * ¿Impacto? Super Amigos no es una clínica veterinaria: no hay "Medicamentos"; lo de
 *   venta libre (pipetas, desparasitantes) va en "Antiparasitarios". El backend guarda la
 *   categoría como texto, así que agregar o quitar una aquí no requiere migración.
 */

export const PRODUCT_CATEGORIES = [
  'Alimento',
  'Antiparasitarios',
  'Aseo',
  'Camas',
  'Cepillado',
  'Comederos',
  'Dental',
  'Gatos',
  'Juguetes',
  'Paseo',
  'Ropa',
  'Snacks',
] as const;
