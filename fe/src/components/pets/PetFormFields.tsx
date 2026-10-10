/**
 * Archivo: components/pets/PetFormFields.tsx
 * Descripción: Campos de la ficha de mascota (nombre, especie, raza, factores de precio del
 *   grooming, condiciones de piel, patología) — SIN el <form> que lo envuelve.
 * ¿Para qué? El mismo set de campos lo usa el staff (StaffPetsPage) y, desde ahora, el propio
 *   cliente en "Mis mascotas" (RF-012). Extraerlo evita mantener dos copias del formulario.
 */

import type { PetFormData } from './petForm';
import type { CoatType, PetBehavior, PetSize, PetSpecies, SkinConditionType } from '@/types/pets';
import { SIZE_LABELS, COAT_LABELS, BEHAVIOR_LABELS, SKIN_CONDITION_LABELS } from '@/types/pricing';
import { InputField } from '@/components/ui/InputField';
import { SelectField } from '@/components/ui/SelectField';
import { BreedCombobox } from '@/components/ui/BreedCombobox';
import { DOG_BREEDS } from '@/data/dogBreeds';
import { CAT_BREEDS } from '@/data/catBreeds';

const SPECIES_OPTIONS: { value: PetSpecies; label: string }[] = [
  { value: 'canina', label: 'Canina' },
  { value: 'felina', label: 'Felina' },
];
const SIZE_OPTIONS = Object.entries(SIZE_LABELS) as [PetSize, string][];
const COAT_OPTIONS = Object.entries(COAT_LABELS) as [CoatType, string][];
const BEHAVIOR_OPTIONS = Object.entries(BEHAVIOR_LABELS) as [PetBehavior, string][];
const SURCHARGE_CONDITIONS: SkinConditionType[] = [
  'pulgas',
  'garrapatas',
  'piel_irritada',
  'alergia',
  'piel_sensible',
  'nudos',
];
const BLOCKING_CONDITIONS: SkinConditionType[] = ['hongos', 'sarna', 'heridas', 'infeccion'];

interface PetFormFieldsProps {
  formData: PetFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onBreedChange: (breed: string) => void;
  onToggleCondition: (type: SkinConditionType) => void;
}

export function PetFormFields({ formData, onChange, onBreedChange, onToggleCondition }: PetFormFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InputField
          id="name"
          name="name"
          label="Nombre de la mascota"
          required
          value={formData.name}
          onChange={onChange}
          placeholder="Ej: Max"
          maxLength={100}
        />
        <SelectField id="species" name="species" label="Especie" required value={formData.species} onChange={onChange}>
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
          onChange={onBreedChange}
          options={formData.species === 'canina' ? DOG_BREEDS : CAT_BREEDS}
        />
      ) : (
        <InputField
          id="breed"
          name="breed"
          label="Raza (opcional)"
          value={formData.breed}
          onChange={onChange}
          disabled
          placeholder="Selecciona primero la especie"
        />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField id="gender" name="gender" label="Sexo (opcional)" value={formData.gender} onChange={onChange}>
          <option value="">Sin especificar</option>
          <option value="Macho">Macho</option>
          <option value="Hembra">Hembra</option>
        </SelectField>
        <InputField id="age" name="age" label="Edad en años (opcional)" type="number" min={0} value={formData.age} onChange={onChange} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InputField
          id="weight"
          name="weight"
          label="Peso en kg (opcional)"
          type="number"
          min={0}
          step="0.1"
          value={formData.weight}
          onChange={onChange}
          placeholder="Ej: 8.5"
        />
        <InputField
          id="color"
          name="color"
          label="Color (opcional)"
          value={formData.color}
          onChange={onChange}
          placeholder="Ej: Café con blanco"
          maxLength={50}
        />
      </div>

      <div className="space-y-4 rounded-lg border border-border p-4">
        <p className="text-sm font-medium text-text">Datos para el precio del grooming</p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SelectField id="size" name="size" label="Tamaño" value={formData.size} onChange={onChange}>
            <option value="">Sugerir desde el peso</option>
            {SIZE_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </SelectField>
          <SelectField id="coatType" name="coatType" label="Tipo de pelo" value={formData.coatType} onChange={onChange}>
            <option value="">Sin especificar</option>
            {COAT_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </SelectField>
          <SelectField id="behavior" name="behavior" label="Comportamiento" value={formData.behavior} onChange={onChange}>
            <option value="">Sin especificar</option>
            {BEHAVIOR_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </SelectField>
        </div>
        <p className="text-xs text-text-muted">
          Tamaño: si lo dejas en "Sugerir desde el peso", el sistema clasifica la talla según los
          kilos registrados. Comportamiento "Agresivo" impide agendar en línea — primero se evalúa
          a la mascota en persona.
        </p>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-text">Condiciones de piel</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              {SURCHARGE_CONDITIONS.map((type) => (
                <label key={type} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.skinConditions.includes(type)}
                    onChange={() => onToggleCondition(type)}
                    className="rounded border-border text-brand-600 focus:ring-brand-500"
                  />
                  {SKIN_CONDITION_LABELS[type]}
                </label>
              ))}
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium text-[color:var(--color-danger)]">
                Requieren revisión antes de un baño (no podrás agendar en línea):
              </p>
              <div className="space-y-1.5">
                {BLOCKING_CONDITIONS.map((type) => (
                  <label key={type} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={formData.skinConditions.includes(type)}
                      onChange={() => onToggleCondition(type)}
                      className="rounded border-border text-[color:var(--color-danger)] focus:ring-[color:var(--color-danger)]"
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
          onChange={onChange}
          rows={2}
          maxLength={300}
          className="focus-ring w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text"
        />
        <p className="text-xs text-text-muted">
          Texto libre para el historial. Si no tiene ninguna, deja escrito "No aplica".
        </p>
      </div>
    </>
  );
}
