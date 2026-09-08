/**
 * Archivo: data/testimonials.ts
 * Descripción: Reseñas de clientes que se muestran en la landing.
 * ¿Para qué? Prueba social. TODO: reemplazar por reseñas reales (Google Business) cuando
 *   el negocio las facilite — el formato es el mismo.
 */

export interface Testimonial {
  name: string;
  pet: string;
  rating: number;
  quote: string;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Laura M.',
    pet: 'Rocky (Golden Retriever)',
    rating: 5,
    quote:
      'Reservé el baño desde el celular y me avisaron cuando estaba listo. Rocky salió feliz y oliendo delicioso. Repetimos seguro.',
  },
  {
    name: 'Andrés P.',
    pet: 'Michi (gato criollo)',
    rating: 5,
    quote:
      'Son pacientes con los gatos, que no es fácil. El corte quedó parejo y me explicaron cómo cuidar su pelo en casa.',
  },
  {
    name: 'Daniela R.',
    pet: 'Nube (Poodle)',
    rating: 5,
    quote:
      'Me gusta que llevan la ficha de Nube con su peso y su piel sensible. Ya saben qué shampoo usarle sin que yo lo repita.',
  },
];
