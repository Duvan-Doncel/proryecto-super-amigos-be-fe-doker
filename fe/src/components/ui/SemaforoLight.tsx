/**
 * Archivo: components/ui/SemaforoLight.tsx
 * Descripción: Luz del semáforo de cuidado (🟢 grooming, 🟡 síntoma leve, 🔴 emergencia).
 * ¿Para qué? Reemplazar los emojis 🟢🟡🔴 por una luz con los colores del diseño que
 *   titila (parpadeo + onda), igual en el inicio del cliente y en cada página del semáforo.
 * ¿Impacto? Con "reducir movimiento" activado en el sistema, la luz queda fija (index.css).
 */

export type SemaforoTone = 'verde' | 'amarillo' | 'rojo';

// ¿Qué? Cuándo titila la luz:
//   - 'always': siempre (títulos de las páginas del semáforo).
//   - 'hover':  al pasar el puntero o el foco por el elemento padre con clase `group`.
//   - 'card':   al pasar el puntero o el foco por un enlace DENTRO del padre `group`
//               (tarjetas del inicio: titila al apuntar a su botón, no a toda la tarjeta).
//   - 'none':   fija.
export type SemaforoBlink = 'always' | 'hover' | 'card' | 'none';

const DOT: Record<SemaforoTone, string> = {
  verde: 'bg-[color:var(--color-success)]',
  amarillo: 'bg-[color:var(--color-warning)]',
  rojo: 'bg-[color:var(--color-accent)]',
};

// ¿Qué? Clases literales completas (Tailwind solo genera las que ve escritas así).
const BLINK: Record<SemaforoBlink, { ping: string; dot: string }> = {
  always: { ping: 'animate-ping opacity-75', dot: 'animate-semaforo' },
  hover: {
    ping: 'opacity-0 group-hover:animate-ping group-hover:opacity-75 group-focus-visible:animate-ping group-focus-visible:opacity-75',
    dot: 'group-hover:animate-semaforo group-focus-visible:animate-semaforo',
  },
  card: {
    ping: 'opacity-0 group-has-[a:hover]:animate-ping group-has-[a:hover]:opacity-75 group-has-[a:focus-visible]:animate-ping group-has-[a:focus-visible]:opacity-75',
    dot: 'group-has-[a:hover]:animate-semaforo group-has-[a:focus-visible]:animate-semaforo',
  },
  none: { ping: 'hidden', dot: '' },
};

const SIZE = { sm: 'h-2 w-2', md: 'h-3 w-3' } as const;

interface SemaforoLightProps {
  tone: SemaforoTone;
  blink?: SemaforoBlink;
  size?: keyof typeof SIZE;
  className?: string;
}

export function SemaforoLight({ tone, blink = 'always', size = 'sm', className = '' }: SemaforoLightProps) {
  const b = BLINK[blink];
  return (
    <span className={`relative inline-flex shrink-0 ${SIZE[size]} ${className}`} aria-hidden="true">
      <span className={`absolute inset-0 rounded-full ${DOT[tone]} ${b.ping}`} />
      <span className={`relative ${SIZE[size]} rounded-full ${DOT[tone]} ${b.dot}`} />
    </span>
  );
}
