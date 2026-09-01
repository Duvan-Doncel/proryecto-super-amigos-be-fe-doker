/**
 * Archivo: components/ui/InputField.tsx
 * Descripción: Campo de formulario accesible con label, input y mensaje de error.
 * ¿Para qué? Evitar repetir el patrón label+input+error en cada formulario del proyecto.
 * ¿Impacto? Centraliza la accesibilidad (aria-invalid, aria-describedby) y el estilo
 *   de todos los inputs. Un cambio aquí aplica a todos los formularios.
 */

import { useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  // ¿Qué? Texto del label visible — requerido para accesibilidad.
  label: string;
  // ¿Qué? ID único del input — necesario para vincular label y mensajes de error.
  id: string;
  // ¿Qué? Mensaje de error a mostrar bajo el input. Vacío = sin error.
  error?: string;
}

export function InputField({ label, id, error, className = '', type = 'text', ...props }: InputFieldProps) {
  const errorId = `${id}-error`;

  // ¿Qué? Estado del "ojo": solo aplica a los campos de contraseña.
  // ¿Para qué? Permitir que el usuario revele lo que escribió para verificar que no
  //   se equivocó — un patrón estándar en formularios de registro y login.
  // ¿Impacto? Cuando está visible el input pasa a type="text", así que el navegador
  //   deja de ocultar el valor y de ofrecer el autocompletado de contraseñas.
  const isPassword = type === 'password';
  const [showPassword, setShowPassword] = useState(false);
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <div className="flex flex-col gap-1.5">
      {/* ¿Qué? Label vinculado al input por htmlFor — obligatorio WCAG AA. */}
      <label
        htmlFor={id}
        className="text-sm font-medium text-gray-700 dark:text-slate-300"
      >
        {label}
      </label>

      {/* ¿Qué? Contenedor relativo para poder posicionar el botón del ojo sobre el input. */}
      <div className="relative">
        <input
          id={id}
          type={inputType}
          // ¿Qué? aria-invalid indica al lector de pantalla que el campo tiene error.
          aria-invalid={!!error}
          // ¿Qué? aria-describedby apunta al mensaje de error para que sea leído.
          aria-describedby={error ? errorId : undefined}
          className={[
            'w-full px-3 py-2 text-sm rounded-lg',
            // ¿Qué? Espacio a la derecha para que el texto no quede debajo del ojo.
            isPassword ? 'pr-10' : '',
            'bg-white dark:bg-slate-800',
            'text-gray-900 dark:text-slate-100',
            'placeholder:text-gray-400 dark:placeholder:text-slate-500',
            'transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-0',
            error
              ? 'border border-red-500 dark:border-red-400'
              : 'border border-gray-300 dark:border-slate-600',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />

        {/* ¿Qué? Botón para mostrar/ocultar la contraseña. Solo en campos type="password". */}
        {/* ¿Para qué? type="button" evita que al pulsarlo se envíe el formulario. */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            // ¿Qué? tabIndex={-1} lo saca del recorrido con Tab — el foco salta del
            //   input de contraseña directo al siguiente campo, no al ojo.
            tabIndex={-1}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={showPassword}
            className={[
              'absolute right-2 top-1/2 -translate-y-1/2',
              'p-1 rounded',
              'text-gray-400 dark:text-slate-500',
              'hover:text-gray-600 dark:hover:text-slate-300',
              'focus:outline-none focus:ring-2 focus:ring-brand-500',
              'transition-colors duration-200',
            ].join(' ')}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        )}
      </div>

      {/* ¿Qué? Mensaje de error accesible con role="alert" para lectores de pantalla. */}
      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-xs text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  );
}
