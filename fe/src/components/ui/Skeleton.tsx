/**
 * Archivo: components/ui/Skeleton.tsx
 * Descripción: Placeholder de carga (bloque gris pulsante).
 * ¿Para qué? Sustituir los "Cargando..." de texto plano por un esqueleto que preserva el
 *   layout y se siente más rápido.
 */

interface SkeletonProps {
  className?: string;
  // ¿Qué? Nº de líneas apiladas (para listas). Por defecto, un solo bloque.
  lines?: number;
}

export function Skeleton({ className = 'h-4 w-full', lines = 1 }: SkeletonProps) {
  if (lines === 1) {
    return <div className={`animate-pulse rounded-md bg-surface-2 ${className}`} aria-hidden="true" />;
  }
  return (
    <div className="space-y-2" aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`animate-pulse rounded-md bg-surface-2 ${className}`} />
      ))}
    </div>
  );
}
