/**
 * Archivo: config/landing.ts
 * Descripción: Cifras y textos de confianza que se muestran en la landing.
 * ¿Para qué? Separar el contenido editable del negocio del maquetado de la página.
 * ¿Impacto? TODO: el negocio debe confirmar estas cifras antes de publicar. Son
 *   estimaciones de referencia, no datos traídos del backend.
 */

export const TRUST_STATS = [
  { value: '6+', label: 'años cuidando mascotas' },
  { value: '3.500+', label: 'baños y cortes realizados' },
  { value: '4.9', label: 'calificación promedio' },
  { value: '100%', label: 'atención con cita previa' },
] as const;
