/**
 * Archivo: pages/staff/StaffPetsPage.tsx
 * Descripción: Registro de mascotas a nombre de un cliente existente (RF-012, HU-012).
 * ¿Para qué? Requisito previo para que el cliente pueda usar 🟢 y 🟡 del semáforo
 *   (RF-009, RF-010) — sin esto, esas opciones quedan bloqueadas para él.
 * ¿Impacto? El staff ubica al cliente por nombre/email/documento (no memoriza UUIDs)
 *   y luego elige la mascota de una lista ya cargada — nunca texto libre para el clientId.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as staffApi from '@/api/staff';
import * as petsApi from '@/api/pets';
import type { ClientSummary } from '@/types/staff';
import type { Pet, PetSpecies } from '@/types/pets';
import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/InputField';
import { SelectField } from '@/components/ui/SelectField';
import { Alert } from '@/components/ui/Alert';

// ¿Qué? Especies aceptadas por el negocio — debe coincidir con el enum del backend.
const SPECIES_OPTIONS: { value: PetSpecies; label: string }[] = [
  { value: 'canina', label: 'Canina' },
  { value: 'felina', label: 'Felina' },
  { value: 'lagomorfo', label: 'Lagomorfo' },
  { value: 'porcina', label: 'Porcina' },
];

interface FormData {
  name: string;
  species: PetSpecies | '';
  breed: string;
  gender: string;
  age: string;
  weight: string;
  color: string;
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
  pathology: 'No aplica',
};

export function StaffPetsPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ClientSummary[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientSummary | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);

  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
    setSuccess(false);
    setError(null);
    petsApi.listPetsByClient(client.id).then(setPets);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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
    setSuccess(false);

    try {
      await petsApi.createPet({
        clientId: selectedClient.id,
        name: formData.name,
        species: formData.species,
        breed: formData.breed || undefined,
        gender: formData.gender || undefined,
        age: formData.age ? Number(formData.age) : undefined,
        weight: formData.weight ? Number(formData.weight) : undefined,
        color: formData.color || undefined,
        pathology: formData.pathology.trim() || 'No aplica',
      });
      setSuccess(true);
      setFormData(EMPTY_FORM);
      const updated = await petsApi.listPetsByClient(selectedClient.id);
      setPets(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar la mascota.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <Link to="/staff" className="text-sm text-gray-500 dark:text-slate-400 hover:underline">
        ← Volver
      </Link>

      <h1 className="text-2xl font-comic tracking-wide text-gray-900 dark:text-slate-100 mt-4 mb-6">
        🐾 Registrar Mascota
      </h1>

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
                    className="w-full text-left rounded-lg border border-gray-200 dark:border-slate-700 px-4 py-3 text-sm hover:border-brand-400 dark:hover:border-brand-500 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors duration-200"
                  >
                    <span className="font-medium text-gray-900 dark:text-slate-100">
                      {c.firstName} {c.lastName}
                    </span>
                    <span className="text-gray-500 dark:text-slate-400"> — {c.email}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <>
          <div className="mb-6 flex items-center justify-between rounded-lg border border-gray-200 dark:border-slate-700 px-4 py-3 text-sm">
            <span>
              Cliente: <strong className="text-gray-900 dark:text-slate-100">{selectedClient.firstName} {selectedClient.lastName}</strong> — {selectedClient.email}
            </span>
            <button
              onClick={() => setSelectedClient(null)}
              className="text-brand-600 dark:text-brand-400 hover:underline"
            >
              Cambiar
            </button>
          </div>

          {success && (
            <div className="mb-4">
              <Alert type="success" message="Mascota registrada correctamente." />
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4 mb-10">
            {error && <Alert type="error" message={error} />}

            <InputField
              id="name"
              name="name"
              label="Nombre de la mascota"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="Ej: Max"
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
            <InputField
              id="breed"
              name="breed"
              label="Raza (opcional)"
              value={formData.breed}
              onChange={handleChange}
            />
            <InputField
              id="gender"
              name="gender"
              label="Sexo (opcional)"
              value={formData.gender}
              onChange={handleChange}
              placeholder="Ej: Macho, Hembra"
            />
            <InputField
              id="age"
              name="age"
              label="Edad en años (opcional)"
              type="number"
              min={0}
              value={formData.age}
              onChange={handleChange}
            />
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
            />

            <div className="flex flex-col gap-1.5">
              <label htmlFor="pathology" className="text-sm font-medium text-gray-700 dark:text-slate-300">
                ¿Tiene alguna patología?
              </label>
              <textarea
                id="pathology"
                name="pathology"
                value={formData.pathology}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 border border-gray-300 dark:border-slate-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-0"
              />
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Si no tiene ninguna, deja escrito "No aplica".
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" isLoading={isSubmitting}>Registrar mascota</Button>
            </div>
          </form>

          <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-3">
            Mascotas de este cliente
          </h2>
          {pets.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-slate-400">Todavía no tiene mascotas registradas.</p>
          ) : (
            <ul className="space-y-2">
              {pets.map((p) => (
                <li key={p.id} className="rounded-lg border border-gray-200 dark:border-slate-700 px-4 py-3 text-sm">
                  <p>
                    <span className="font-medium text-gray-900 dark:text-slate-100">{p.name}</span>
                    <span className="text-gray-500 dark:text-slate-400">
                      {' '}— {SPECIES_OPTIONS.find((opt) => opt.value === p.species)?.label ?? p.species}
                      {p.breed ? `, ${p.breed}` : ''}
                      {p.age != null ? `, ${p.age} año(s)` : ''}
                      {p.weight != null ? `, ${p.weight} kg` : ''}
                      {p.color ? `, ${p.color}` : ''}
                    </span>
                  </p>
                  <p className="text-gray-500 dark:text-slate-400">Patología: {p.pathology}</p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
