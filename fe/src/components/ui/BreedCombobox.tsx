/**
 * Archivo: components/ui/BreedCombobox.tsx
 * Descripción: Campo de raza con autocompletado, restringido al catálogo de
 *   `data/dogBreeds.ts` (nomenclatura FCI) — reemplaza el input de texto libre en
 *   StaffPetsPage.tsx (RF-012).
 * ¿Para qué? El input libre permitía razas mal escritas o con capitalización distinta
 *   cada vez ("labrador", "Labrador Retriever", "LABRADOR"). Aquí el valor solo puede
 *   ser exactamente una entrada del catálogo — se escribe para filtrar, no para dictar
 *   el texto final.
 * ¿Impacto? Si el usuario deja el campo sin escoger una opción de la lista, se limpia al
 *   perder el foco en vez de guardar texto libre — es la única forma de garantizar que
 *   nunca se guarde una raza que no esté en el catálogo.
 */

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface BreedComboboxProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
}

// ¿Qué? Quita tildes para poder buscar "aleman" y encontrar "Alemán".
// ¿Para qué? El staff no siempre escribe con acentos — el filtro no debería exigirlo.
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export function BreedCombobox({
  id,
  name,
  label,
  value,
  onChange,
  options,
  placeholder = 'Escribe para buscar una raza…',
  disabled = false,
}: BreedComboboxProps) {
  // ¿Qué? Texto que se ve en el input mientras se escribe/filtra.
  // ¿Para qué? Separado de `value` porque mientras el usuario teclea, todavía no ha
  //   elegido una raza válida — `value` solo cambia cuando selecciona una opción real.
  const [inputText, setInputText] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  // ¿Qué? Si el valor cambia desde afuera (ej. al cargar una mascota para editar),
  //   refleja ese valor en el texto visible.
  useEffect(() => {
    setInputText(value);
  }, [value]);

  const filtered = useMemo(() => {
    const term = normalize(inputText.trim());
    if (!term) return options;
    return options.filter((breed) => normalize(breed).includes(term));
  }, [inputText, options]);

  // ¿Qué? Cierra la lista al hacer clic fuera del componente.
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        // ¿Qué? Si lo que quedó escrito no es exactamente una raza del catálogo,
        //   se descarta — así nunca se guarda texto que no sea del catálogo (RN-126-like).
        if (inputText.trim() !== value) {
          setInputText(value);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [inputText, value]);

  const selectBreed = (breed: string) => {
    onChange(breed);
    setInputText(breed);
    setIsOpen(false);
  };

  const clearSelection = () => {
    onChange('');
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setIsOpen(true);
      return;
    }
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[activeIndex]) selectBreed(filtered[activeIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      <label htmlFor={id} className="text-sm font-medium text-text">
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          name={name}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          autoComplete="off"
          disabled={disabled}
          value={inputText}
          placeholder={placeholder}
          onChange={(e) => {
            setInputText(e.target.value);
            setActiveIndex(0);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className={[
            'w-full px-3 py-2 pr-16 text-sm rounded-lg',
            'bg-surface',
            'text-text',
            'placeholder:text-text-muted/70',
            'border border-border',
            'transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-0',
            'disabled:opacity-60 disabled:cursor-not-allowed',
          ].join(' ')}
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={clearSelection}
              tabIndex={-1}
              aria-label="Quitar raza seleccionada"
              className="p-1 rounded text-text-muted hover:text-text"
            >
              ✕
            </button>
          )}
          <ChevronDown className="h-4 w-4 text-text-muted" aria-hidden="true" />
        </div>

        {isOpen && (
          <ul
            id={listboxId}
            role="listbox"
            className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-border bg-surface shadow-[var(--shadow-pop)]"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-text-muted">
                Ninguna raza coincide con “{inputText}”.
              </li>
            ) : (
              filtered.map((breed, index) => (
                <li
                  key={breed}
                  role="option"
                  aria-selected={breed === value}
                  onMouseDown={(e) => {
                    // ¿Qué? preventDefault evita que el input pierda el foco antes del click.
                    e.preventDefault();
                    selectBreed(breed);
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={[
                    'px-3 py-2 text-sm cursor-pointer',
                    index === activeIndex
                      ? 'bg-[color:var(--color-primary)]/10 text-[color:var(--color-primary)]'
                      : 'text-text',
                  ].join(' ')}
                >
                  {breed}
                </li>
              ))
            )}
          </ul>
        )}
      </div>
      <p className="text-xs text-text-muted">
        Selecciona una raza de la lista. Si es mestiza/criolla, deja el campo vacío.
      </p>
    </div>
  );
}
