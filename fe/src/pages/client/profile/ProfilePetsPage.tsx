/**
 * Archivo: pages/client/profile/ProfilePetsPage.tsx
 * Descripción: Sección "Mis mascotas" del perfil de cliente (RF-012).
 * ¿Para qué? Antes solo el staff registraba mascotas y el cliente las veía de solo lectura.
 *   Ahora el cliente registra, edita, elimina y sube la foto de sus propias mascotas — sin
 *   depender de que el staff lo haga por él.
 */

import { useEffect, useMemo, useState } from 'react';
import { PawPrint, Plus, Pencil, Trash2, Camera } from 'lucide-react';
import * as petsApi from '@/api/pets';
import type { Pet, PetSpecies, SkinConditionType } from '@/types/pets';
import { SPECIES_LABELS, SIZE_LABELS, COAT_LABELS } from '@/types/pricing';
import { resolveUploadUrl } from '@/utils/media';
import { rowNumber } from '@/utils/tablePaging';
import { usePagination } from '@/hooks/usePagination';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Alert } from '@/components/ui/Alert';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { FilterBar } from '@/components/ui/FilterBar';
import { SelectField } from '@/components/ui/SelectField';
import { InputField } from '@/components/ui/InputField';
import { PetFormFields } from '@/components/pets/PetFormFields';
import { EMPTY_PET_FORM, petFormToPayload, petToForm, type PetFormData } from '@/components/pets/petForm';

export function ProfilePetsPage() {
  const { showToast } = useToast();
  const [pets, setPets] = useState<Pet[] | null>(null);

  const [speciesFilter, setSpeciesFilter] = useState<PetSpecies | ''>('');
  const [search, setSearch] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [formData, setFormData] = useState<PetFormData>(EMPTY_PET_FORM);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Pet | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadPets = () => petsApi.listMyPets().then(setPets).catch(() => setPets([]));

  useEffect(() => {
    loadPets();
  }, []);

  const filtered = useMemo(() => {
    return (pets ?? []).filter((p) => {
      if (speciesFilter && p.species !== speciesFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !(p.breed ?? '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [pets, speciesFilter, search]);

  const { pageItems, page, setPage, pageSize, setPageSize, pageCount, total } = usePagination(filtered, 6);
  const hasActiveFilters = speciesFilter !== '' || search.trim() !== '';

  const openCreate = () => {
    setEditingPet(null);
    setFormData(EMPTY_PET_FORM);
    setPhotoFile(null);
    setPhotoPreview(null);
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (pet: Pet) => {
    setEditingPet(pet);
    setFormData(petToForm(pet));
    setPhotoFile(null);
    setPhotoPreview(resolveUploadUrl(pet.photoUrl));
    setFormError(null);
    setFormOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleBreedChange = (breed: string) => setFormData((prev) => ({ ...prev, breed }));

  const toggleCondition = (type: SkinConditionType) => {
    setFormData((prev) => ({
      ...prev,
      skinConditions: prev.skinConditions.includes(type)
        ? prev.skinConditions.filter((c) => c !== type)
        : [...prev.skinConditions, type],
    }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.species) {
      setFormError('Selecciona la especie de la mascota.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const payload = petFormToPayload(formData);
      const pet = editingPet
        ? await petsApi.updateMyPet(editingPet.id, payload)
        : await petsApi.createMyPet(payload);

      if (photoFile) {
        await petsApi.uploadPetPhoto(pet.id, photoFile);
      }

      showToast(editingPet ? 'Mascota actualizada.' : 'Mascota registrada.', 'success');
      setFormOpen(false);
      loadPets();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar la mascota.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await petsApi.deleteMyPet(toDelete.id);
      showToast('Mascota eliminada.', 'success');
      setToDelete(null);
      loadPets();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo eliminar.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const loading = pets === null;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Mis mascotas"
        description="Registra, edita y sube la foto de tus mascotas — la ficha alimenta el precio de sus citas."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Agregar mascota
          </Button>
        }
      />

      <FilterBar
        onClear={() => {
          setSpeciesFilter('');
          setSearch('');
        }}
        hasActiveFilters={hasActiveFilters}
      >
        <div className="w-40">
          <SelectField
            id="species-filter"
            label="Especie"
            value={speciesFilter}
            onChange={(e) => setSpeciesFilter(e.target.value as PetSpecies | '')}
          >
            <option value="">Todas</option>
            <option value="canina">Canina</option>
            <option value="felina">Felina</option>
          </SelectField>
        </div>
        <div className="w-56">
          <InputField
            id="pet-search"
            label="Buscar por nombre o raza"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ej: Max"
          />
        </div>
      </FilterBar>

      {loading ? (
        <Skeleton className="h-40 w-full" lines={2} />
      ) : total === 0 ? (
        <EmptyState
          icon={<PawPrint className="h-6 w-6" />}
          title={hasActiveFilters ? 'Sin resultados con estos filtros' : 'Todavía no tienes mascotas registradas'}
          description={hasActiveFilters ? undefined : 'Agrega tu primera mascota para poder agendar sus citas.'}
          action={!hasActiveFilters ? <Button onClick={openCreate}>Agregar mascota</Button> : undefined}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pageItems.map((p, i) => (
              <div key={p.id} className="relative overflow-hidden rounded-xl border border-border">
                <span className="absolute left-2 top-2 z-10 rounded-full bg-black/50 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  #{rowNumber(page, pageSize, i)}
                </span>
                <div className="flex h-32 items-center justify-center bg-surface-2">
                  {p.photoUrl ? (
                    <img
                      src={resolveUploadUrl(p.photoUrl) ?? undefined}
                      alt={`Foto de ${p.name}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <PawPrint className="h-10 w-10 text-text-muted" aria-hidden="true" />
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-text">{p.name}</p>
                      <p className="text-xs text-text-muted">
                        {SPECIES_LABELS[p.species]}
                        {p.breed ? ` · ${p.breed}` : ''}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        aria-label={`Editar ${p.name}`}
                        className="focus-ring rounded-lg p-1.5 text-text-muted hover:bg-surface-2 hover:text-text"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setToDelete(p)}
                        aria-label={`Eliminar ${p.name}`}
                        className="focus-ring rounded-lg p-1.5 text-text-muted hover:bg-surface-2 hover:text-[color:var(--color-danger)]"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <dl className="mt-3 space-y-1 text-xs text-text-muted">
                    {p.size && (
                      <div className="flex justify-between">
                        <dt>Talla</dt>
                        <dd className="text-text">{SIZE_LABELS[p.size]}</dd>
                      </div>
                    )}
                    {p.coatType && (
                      <div className="flex justify-between">
                        <dt>Pelaje</dt>
                        <dd className="text-text">{COAT_LABELS[p.coatType]}</dd>
                      </div>
                    )}
                    {p.weight != null && (
                      <div className="flex justify-between">
                        <dt>Peso</dt>
                        <dd className="text-text">{p.weight} kg</dd>
                      </div>
                    )}
                  </dl>
                  {p.skinConditions.length > 0 && (
                    <p className="mt-2 text-xs text-[color:var(--color-warning)]">
                      Condiciones de piel registradas: {p.skinConditions.length}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Pagination
            page={page}
            pageCount={pageCount}
            total={total}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            itemNoun="mascotas"
          />
        </>
      )}

      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingPet ? `Editar a ${editingPet.name}` : 'Agregar mascota'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button form="pet-form" type="submit" isLoading={saving}>
              {editingPet ? 'Guardar cambios' : 'Registrar mascota'}
            </Button>
          </>
        }
      >
        <form id="pet-form" onSubmit={handleSubmit} noValidate className="space-y-4">
          {formError && <Alert type="error" message={formError} />}

          <div className="flex items-center gap-4">
            <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-surface-2">
              {photoPreview ? (
                <img src={photoPreview} alt="Vista previa de la foto" className="h-full w-full object-cover" />
              ) : (
                <PawPrint className="h-8 w-8 text-text-muted" aria-hidden="true" />
              )}
            </div>
            <label className="focus-ring inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text hover:bg-surface-2">
              <Camera className="h-4 w-4" aria-hidden="true" />
              {photoPreview ? 'Cambiar foto' : 'Subir foto'}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handlePhotoChange} />
            </label>
          </div>

          <PetFormFields
            formData={formData}
            onChange={handleChange}
            onBreedChange={handleBreedChange}
            onToggleCondition={toggleCondition}
          />
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title="Eliminar mascota"
        message={`¿Eliminar a "${toDelete?.name}"? También se eliminarán sus citas y reportes asociados.`}
        confirmLabel="Eliminar"
        isLoading={deleting}
      />
    </div>
  );
}
