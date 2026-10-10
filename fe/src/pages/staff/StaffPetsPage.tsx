/**
 * Archivo: pages/staff/StaffPetsPage.tsx
 * Descripción: Registro y edición de mascotas a nombre de un cliente existente (RF-012, HU-012).
 * ¿Para qué? Requisito previo para que el cliente pueda usar 🟢 y 🟡 del semáforo
 *   (RF-009, RF-010). El staff también fija aquí los factores de precio del grooming:
 *   tamaño, tipo de pelo y condiciones de piel (RF-014).
 * ¿Impacto? El staff ubica al cliente por nombre/email/documento (no memoriza UUIDs)
 *   y luego elige la mascota de una lista ya cargada — nunca texto libre para el clientId.
 */

import { useState } from 'react';
import * as staffApi from '@/api/staff';
import * as petsApi from '@/api/pets';
import type { ClientSummary } from '@/types/staff';
import type { CoatType, Pet, PetBehavior, PetSize, PetSpecies, SkinConditionType } from '@/types/pets';
import { SIZE_LABELS, COAT_LABELS, BEHAVIOR_LABELS, SKIN_CONDITION_LABELS } from '@/types/pricing';
import { PageHeader } from '@/components/ui/PageHeader';
import { Pagination } from '@/components/ui/Pagination';
import { usePagination } from '@/hooks/usePagination';
import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/InputField';
import { SelectField } from '@/components/ui/SelectField';
import { BreedCombobox } from '@/components/ui/BreedCombobox';
import { Alert } from '@/components/ui/Alert';
import { DOG_BREEDS } from '@/data/dogBreeds';
import { CAT_BREEDS } from '@/data/catBreeds';
import { rowNumber } from '@/utils/tablePaging';

const SPECIES_OPTIONS: { value: PetSpecies; label: string }[] = [
  { value: 'canina', label: 'Canina' },
  { value: 'felina', label: 'Felina' },
];
const SIZE_OPTIONS = Object.entries(SIZE_LABELS) as [PetSize, string][];
const COAT_OPTIONS = Object.entries(COAT_LABELS) as [CoatType, string][];
const BEHAVIOR_OPTIONS = Object.entries(BEHAVIOR_LABELS) as [PetBehavior, string][];
// ¿Qué? Las 6 que suman recargo y las 4 que bloquean la cita — mismo orden que el enum del backend.
const SURCHARGE_CONDITIONS: SkinConditionType[] = [
  'pulgas',
  'garrapatas',
  'piel_irritada',
  'alergia',
  'piel_sensible',
  'nudos',
];
const BLOCKING_CONDITIONS: SkinConditionType[] = ['hongos', 'sarna', 'heridas', 'infeccion'];

interface FormData {
  name: string;
  species: PetSpecies | '';
  breed: string;
  gender: string;
  age: string;
  weight: string;
  color: string;
  size: PetSize | '';
  coatType: CoatType | '';
  behavior: PetBehavior | '';
  skinConditions: SkinConditionType[];
  pathology: string;
}

const EMPTY_FORM: FormData = {
  name: '',
  species: '',
  breed: '',
  gender: '',
  age: '',
  weight: '',
  color: '',
  size: '',
  coatType: '',
  behavior: '',
  skinConditions: [],
  pathology: 'No aplica',
};

function petToForm(pet: Pet): FormData {
  return {
    name: pet.name,
    species: pet.species,
    breed: pet.breed ?? '',
    gender: pet.gender ?? '',
    age: pet.age != null ? String(pet.age) : '',
    weight: pet.weight != null ? String(pet.weight) : '',
    color: pet.color ?? '',
    size: pet.size ?? '',
    coatType: pet.coatType ?? '',
    behavior: pet.behavior ?? '',
    skinConditions: pet.skinConditions.map((c) => c.type),
    pathology: pet.pathology,
  };
}

export function StaffPetsPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ClientSummary[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientSummary | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  // ¿Qué? null = el formulario crea una mascota nueva; un id = está editando esa mascota.
  const [editingId, setEditingId] = useState<string | null>(null);

  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const petsPage = usePagination(pets, 8);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length < 2) {
      setError('Escribe al menos 2 caracteres para buscar.');
      return;
    }
    setIsSearching(true);
    setError(null);
    setSelectedClient(null);
    try {
      const found = await staffApi.searchClients(query.trim());
      setResults(found);
      if (found.length === 0) setError('No se encontró ningún cliente con ese criterio.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo buscar el cliente.');
    } finally {
      setIsSearching(false);
    }
  };

  const selectClient = (client: ClientSummary) => {
    setSelectedClient(client);
    setResults([]);
    setSuccess(null);
    setError(null);
    resetForm();
    petsApi.listPetsByClient(client.id).then(setPets);
  };

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setEditingId(null);
  };

  const startEdit = (pet: Pet) => {
    setFormData(petToForm(pet));
    setEditingId(pet.id);
    setSuccess(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleBreedChange = (breed: string) => {
    setFormData((prev) => ({ ...prev, breed }));
  };

  const toggleCondition = (type: SkinConditionType) => {
    setFormData((prev) => ({
      ...prev,
      skinConditions: prev.skinConditions.includes(type)
        ? prev.skinConditions.filter((c) => c !== type)
        : [...prev.skinConditions, type],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    if (!formData.species) {
      setError('Selecciona la especie de la mascota.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const payload = {
      name: formData.name,
      species: formData.species,
      breed: formData.breed || undefined,
      gender: formData.gender || undefined,
      age: formData.age ? Number(formData.age) : undefined,
      weight: formData.weight ? Number(formData.weight) : undefined,
      color: formData.color || undefined,
      size: formData.size || undefined,
      coatType: formData.coatType || undefined,
      behavior: formData.behavior || undefined,
      skinConditions: formData.skinConditions.map((type) => ({ type })),
      pathology: formData.pathology.trim() || 'No aplica',
    };

    try {
      if (editingId) {
        await petsApi.updatePet(editingId, payload);
        setSuccess('Cambios guardados.');
      } else {
        await petsApi.createPet({ clientId: selectedClient.id, ...payload });
        setSuccess('Mascota registrada correctamente.');
      }
      resetForm();
      setPets(await petsApi.listPetsByClient(selectedClient.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la mascota.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`${selectedClient ? 'max-w-6xl' : 'max-w-2xl'} mx-auto transition-all duration-200`}>
      <PageHeader
        title="Registrar mascota"
        description="Registra y actualiza mascotas a nombre de un cliente. Requisito para que pueda agendar citas y reportar síntomas."
      />

      {!selectedClient ? (
        <>
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <div className="flex-1">
              <InputField
                id="query"
                name="query"
                label="Buscar cliente por nombre, email o documento"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ej: Juan Pérez, juan@correo.com"
                maxLength={100}
              />
            </div>
            <div className="pt-7">
              <Button type="submit" isLoading={isSearching}>Buscar</Button>
            </div>
          </form>

          {error && <Alert type="error" message={error} />}

          {results.length > 0 && (
            <ul className="mt-4 space-y-2">
              {results.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => selectClient(c)}
                    className="w-full text-left rounded-lg border border-border px-4 py-3 text-sm hover:border-brand-400 dark:hover:border-brand-500 hover:bg-surface-2 transition-colors duration-200"
                  >
                    <span className="font-medium text-text">
                      {c.firstName} {c.lastName}
                    </span>
                    <span className="text-text-muted"> — {c.email}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <>
          <div className="mb-6 flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm">
            <span>
              Cliente: <strong className="text-text">{selectedClient.firstName} {selectedClient.lastName}</strong> — {selectedClient.email}
            </span>
            <button
              onClick={() => setSelectedClient(null)}
              className="text-[color:var(--color-primary)] hover:underline"
            >
              Cambiar
            </button>
          </div>

          {success && (
            <div className="mb-4">
              <Alert type="success" message={success} />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {error && <Alert type="error" message={error} />}

            {editingId && (
              <p className="text-sm text-brand-700 dark:text-brand-300">
                Editando una mascota existente.{' '}
                <button type="button" onClick={resetForm} className="underline">
                  Cancelar y registrar una nueva
                </button>
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                id="name"
                name="name"
                label="Nombre de la mascota"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Ej: Max"
                maxLength={100}
              />
              <SelectField
                id="species"
                name="species"
                label="Especie"
                required
                value={formData.species}
                onChange={handleChange}
              >
                <option value="" disabled>Selecciona una especie</option>
                {SPECIES_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </SelectField>
            </div>
            {formData.species === 'canina' || formData.species === 'felina' ? (
              <BreedCombobox
                id="breed"
                name="breed"
                label="Raza (opcional)"
                value={formData.breed}
                onChange={handleBreedChange}
                options={formData.species === 'canina' ? DOG_BREEDS : CAT_BREEDS}
              />
            ) : (
              <InputField
                id="breed"
                name="breed"
                label="Raza (opcional)"
                value={formData.breed}
                onChange={handleChange}
                disabled
                placeholder="Selecciona primero la especie"
              />
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SelectField
                id="gender"
                name="gender"
                label="Sexo (opcional)"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="">Sin especificar</option>
                <option value="Macho">Macho</option>
                <option value="Hembra">Hembra</option>
              </SelectField>
              <InputField
                id="age"
                name="age"
                label="Edad en años (opcional)"
                type="number"
                min={0}
                value={formData.age}
                onChange={handleChange}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                id="weight"
                name="weight"
                label="Peso en kg (opcional)"
                type="number"
                min={0}
                step="0.1"
                value={formData.weight}
                onChange={handleChange}
                placeholder="Ej: 8.5"
              />
              <InputField
                id="color"
                name="color"
                label="Color (opcional)"
                value={formData.color}
                onChange={handleChange}
                placeholder="Ej: Café con blanco"
                maxLength={50}
              />
            </div>

            {/* ─── Factores de precio del grooming (RF-014) ─── */}
            <div className="rounded-lg border border-border p-4 space-y-4">
              <p className="text-sm font-medium text-text">
                Datos para el precio del grooming
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <SelectField
                  id="size"
                  name="size"
                  label="Tamaño"
                  value={formData.size}
                  onChange={handleChange}
                >
                  <option value="">Sugerir desde el peso</option>
                  {SIZE_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </SelectField>

                <SelectField
                  id="coatType"
                  name="coatType"
                  label="Tipo de pelo"
                  value={formData.coatType}
                  onChange={handleChange}
                >
                  <option value="">Sin especificar</option>
                  {COAT_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </SelectField>

                <SelectField
                  id="behavior"
                  name="behavior"
                  label="Comportamiento"
                  value={formData.behavior}
                  onChange={handleChange}
                >
                  <option value="">Sin especificar</option>
                  {BEHAVIOR_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </SelectField>
              </div>
              <p className="text-xs text-text-muted">
                Tamaño: si lo dejas en “Sugerir desde el peso”, el sistema clasifica la talla
                según los kilos registrados. Comportamiento: “Agresivo” impide que el cliente
                agende en la app — primero se evalúa a la mascota en persona.
              </p>

              <fieldset>
                <legend className="text-sm font-medium text-text mb-2">
                  Condiciones de piel
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    {SURCHARGE_CONDITIONS.map((type) => (
                      <label key={type} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={formData.skinConditions.includes(type)}
                          onChange={() => toggleCondition(type)}
                          className="rounded border-border text-brand-600 focus:ring-brand-500"
                        />
                        {SKIN_CONDITION_LABELS[type]}
                      </label>
                    ))}
                  </div>
                  <div>
                    <p className="mb-1.5 text-xs font-medium text-red-700 dark:text-red-400">
                      Requieren revisión antes de un baño (el cliente no podrá agendar):
                    </p>
                    <div className="space-y-1.5">
                      {BLOCKING_CONDITIONS.map((type) => (
                        <label key={type} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={formData.skinConditions.includes(type)}
                            onChange={() => toggleCondition(type)}
                            className="rounded border-border text-red-600 focus:ring-red-500"
                          />
                          {SKIN_CONDITION_LABELS[type]}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </fieldset>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="pathology" className="text-sm font-medium text-text">
                Notas de patología
              </label>
              <textarea
                id="pathology"
                name="pathology"
                value={formData.pathology}
                onChange={handleChange}
                rows={2}
                maxLength={300}
                className="w-full px-3 py-2 text-sm rounded-lg bg-surface text-text border border-border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-0"
              />
              <p className="text-xs text-text-muted">
                Texto libre para el historial. Si no tiene ninguna, deja escrito “No aplica”.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" isLoading={isSubmitting}>
                {editingId ? 'Guardar cambios' : 'Registrar mascota'}
              </Button>
            </div>
          </form>

          <div>
            <h2 className="text-lg font-semibold text-text mb-3">
              Mascotas de este cliente
            </h2>
            {pets.length === 0 ? (
              <p className="text-sm text-text-muted">Todavía no tiene mascotas registradas.</p>
            ) : (
              <>
              <ul className="space-y-2">
              {petsPage.pageItems.map((p, i) => (
                <li key={p.id} className="rounded-lg border border-border px-4 py-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p>
                        <span className="mr-1 text-text-muted">#{rowNumber(petsPage.page, petsPage.pageSize, i)}</span>
                        <span className="font-medium text-text">{p.name}</span>
                        <span className="text-text-muted">
                          {' '}— {SPECIES_OPTIONS.find((opt) => opt.value === p.species)?.label ?? p.species}
                          {p.breed ? `, ${p.breed}` : ''}
                          {p.weight != null ? `, ${p.weight} kg` : ''}
                          {p.size ? `, ${SIZE_LABELS[p.size].toLowerCase()}` : ''}
                          {p.coatType ? `, pelo ${COAT_LABELS[p.coatType].toLowerCase()}` : ''}
                          {p.behavior ? `, ${BEHAVIOR_LABELS[p.behavior].toLowerCase()}` : ''}
                        </span>
                      </p>
                      {p.skinConditions.length > 0 && (
                        <p className="mt-1 text-text-muted">
                          Piel: {p.skinConditions.map((c) => SKIN_CONDITION_LABELS[c.type]).join(', ')}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => startEdit(p)}
                      className="shrink-0 text-[color:var(--color-primary)] hover:underline"
                    >
                      Editar
                    </button>
                  </div>
                </li>
              ))}
              </ul>
              <Pagination
                page={petsPage.page}
                pageCount={petsPage.pageCount}
                total={petsPage.total}
                pageSize={petsPage.pageSize}
                onPageChange={petsPage.setPage}
                onPageSizeChange={petsPage.setPageSize}
                itemNoun="mascotas"
              />
              </>
            )}
          </div>
          </div>
        </>
      )}
    </div>
  );
}
