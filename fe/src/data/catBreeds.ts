/**
 * Archivo: data/catBreeds.ts
 * Descripción: Nomenclatura oficial de razas felinas de la FIFe (Fédération Internationale
 *   Féline, https://fifeweb.org/wp/breeds/) — el equivalente para gatos de la FCI (perros).
 * ¿Para qué? Mismo problema que con `dogBreeds.ts`: el campo de raza para mascotas felinas
 *   era texto libre y producía registros inconsistentes ("siames", "Siamés", "SIAMES").
 * ¿Impacto? Usado por `BreedCombobox.tsx` cuando `species === 'felina'` en StaffPetsPage.tsx.
 */

// ¿Qué? Ya en español y con la capitalización final — a diferencia de dogBreeds.ts, aquí no
//   hace falta una función de formateo porque la fuente (FIFe) está solo en inglés y se
//   tradujo a mano, entrada por entrada, en vez de copiarse literal.
export const CAT_BREEDS: string[] = [
  'Abisinio',
  'Angora Turco',
  'Azul Ruso',
  'Balinés',
  'Bengala',
  'Bombay',
  'Bosque de Noruega',
  'Británico de Pelo Corto',
  'Británico de Pelo Largo',
  'Burmés',
  'Burmilla',
  'Chartreux',
  'Cornish Rex',
  'Curl Americano de Pelo Corto',
  'Curl Americano de Pelo Largo',
  'Cymric',
  'Devon Rex',
  'Don Sphynx',
  'Esfinge (Sphynx)',
  'Europeo',
  'Exótico',
  'Gato Doméstico de Pelo Corto',
  'Gato Doméstico de Pelo Largo',
  'Japonés Bobtail de Pelo Corto',
  'Korat',
  'Kuriles Bobtail de Pelo Corto',
  'Kuriles Bobtail de Pelo Largo',
  'LaPerm de Pelo Corto',
  'LaPerm de Pelo Largo',
  'Lykoi',
  'Maine Coon',
  'Manx',
  'Mau Egipcio',
  'Neva Masquerade',
  'Ocicat',
  'Oriental de Pelo Corto',
  'Oriental de Pelo Largo',
  'Persa',
  'Peterbald',
  'Ragdoll',
  'Rex Alemán',
  'Sagrado de Birmania',
  'Selkirk Rex de Pelo Corto',
  'Selkirk Rex de Pelo Largo',
  'Siamés',
  'Siberiano',
  'Singapura',
  'Snowshoe',
  'Sokoke',
  'Somalí',
  'Tailandés',
].sort((a, b) => a.localeCompare(b, 'es'));
