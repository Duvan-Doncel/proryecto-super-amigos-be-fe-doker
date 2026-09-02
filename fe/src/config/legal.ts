/**
 * Archivo: config/legal.ts
 * Descripción: Datos del negocio y versiones de los documentos legales.
 * ¿Para qué? Los Términos y Condiciones, la Política de Privacidad y el footer usan
 *   los mismos datos de contacto y la misma fecha/versión — se editan en un solo sitio.
 * ¿Impacto? Solo son textos del frontend. El negocio debe revisar y completar los
 *   campos marcados como pendientes (NIT, razón social, correo legal) antes de publicar.
 */

export const BUSINESS = {
  nombreComercial: 'Super Amigos Grooming Spa',
  // ¿Qué? Pendiente de confirmar por el negocio — razón social y NIT registrados en Cámara de Comercio.
  razonSocial: 'Super Amigos Grooming Spa (razón social por confirmar)',
  nit: 'NIT por confirmar',
  direccion: 'Cra 77L # 78-88 Sur, Manzana 1B, Bogotá D.C., Colombia',
  ciudad: 'Bogotá D.C.',
  telefono: '321 285 2797',
  telefonoDigitos: '3212852797',
  correoContacto: 'superamigosgroomingspaa@gmail.com',
  // ¿Qué? Correo del área que atiende peticiones de datos personales (habeas data).
  correoDatos: 'superamigosgroomingspaa@gmail.com',
  horario: 'Todos los días de 9:00 a. m. a 6:00 p. m.',
} as const;

// ¿Qué? Versión y fecha de la última actualización de los documentos legales.
// ¿Para qué? Se muestra en las páginas y en el "sello de consentimiento" del registro,
//   para dejar constancia de qué versión aceptó el usuario.
export const LEGAL_VERSION = '1.0';
export const LEGAL_UPDATED_AT = '1 de septiembre de 2026';
