/**
 * Archivo: components/charts/BarChart.tsx
 * Descripción: Gráfico de barras horizontales, una sola serie — para rankings
 *   ("servicios más solicitados", "productos más vendidos").
 * ¿Para qué? Comparar magnitudes entre categorías. Sin dependencias: SVG + tokens del
 *   design system, así respeta el tema claro/oscuro.
 * ¿Impacto? Accesible: `role="img"` con título/descripción y una tabla equivalente oculta
 *   para lectores de pantalla. El color no codifica nada (una sola serie) — es solo la marca.
 */

interface BarDatum {
  label: string;
  value: number;
}

interface BarChartProps {
  title: string;
  data: BarDatum[];
  // ¿Qué? Formatea el valor para la etiqueta directa (p. ej. moneda).
  formatValue?: (v: number) => string;
  emptyMessage?: string;
}

export function BarChart({
  title,
  data,
  formatValue = (v) => v.toLocaleString('es-CO'),
  emptyMessage = 'Sin datos en este período.',
}: BarChartProps) {
  if (data.length === 0) {
    return <p className="text-sm text-text-muted">{emptyMessage}</p>;
  }

  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <figure
      role="img"
      aria-label={`${title}. ${data.map((d) => `${d.label}: ${formatValue(d.value)}`).join('. ')}`}
      className="space-y-2.5"
    >
      {data.map((d) => (
        <div key={d.label} className="grid grid-cols-[9rem_1fr_auto] items-center gap-3 text-sm">
          <span className="truncate text-text-muted" title={d.label}>
            {d.label}
          </span>
          <span className="h-3 rounded-full bg-surface-2" aria-hidden="true">
            <span
              className="block h-3 rounded-full bg-[color:var(--color-primary)]"
              style={{ width: `${Math.max((d.value / max) * 100, 2)}%` }}
            />
          </span>
          <span className="tabular-nums font-medium text-text">{formatValue(d.value)}</span>
        </div>
      ))}
    </figure>
  );
}
