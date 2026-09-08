/**
 * Archivo: components/charts/TrendChart.tsx
 * Descripción: Gráfico de área + línea, una sola serie — evolución en el tiempo
 *   ("ingresos últimos 7 días").
 * ¿Para qué? Ver la tendencia de un período corto de un vistazo. SVG sin dependencias,
 *   colores desde tokens (tema-aware).
 * ¿Impacto? Accesible: `role="img"` con resumen y puntos con <title> por dato.
 */

interface TrendPoint {
  label: string;
  value: number;
}

interface TrendChartProps {
  title: string;
  data: TrendPoint[];
  formatValue?: (v: number) => string;
  height?: number;
}

export function TrendChart({
  title,
  data,
  formatValue = (v) => v.toLocaleString('es-CO'),
  height = 140,
}: TrendChartProps) {
  if (data.length < 2) {
    return <p className="text-sm text-text-muted">Aún no hay suficientes datos para la tendencia.</p>;
  }

  const width = 480;
  const pad = { top: 8, right: 8, bottom: 20, left: 8 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const max = Math.max(...data.map((d) => d.value), 1);

  const x = (i: number) => pad.left + (i / (data.length - 1)) * innerW;
  const y = (v: number) => pad.top + innerH - (v / max) * innerH;

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(d.value)}`).join(' ');
  const areaPath = `${linePath} L ${x(data.length - 1)} ${pad.top + innerH} L ${x(0)} ${pad.top + innerH} Z`;

  return (
    <figure
      role="img"
      aria-label={`${title}. ${data.map((d) => `${d.label}: ${formatValue(d.value)}`).join('. ')}`}
    >
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none">
        <path d={areaPath} fill="var(--color-primary)" opacity="0.12" />
        <path
          d={linePath}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {data.map((d, i) => (
          <g key={d.label}>
            <circle cx={x(i)} cy={y(d.value)} r="3.5" fill="var(--color-primary)">
              <title>
                {d.label}: {formatValue(d.value)}
              </title>
            </circle>
            <text
              x={x(i)}
              y={height - 6}
              textAnchor="middle"
              className="fill-[color:var(--color-text-muted)] text-[9px]"
            >
              {d.label}
            </text>
          </g>
        ))}
      </svg>
    </figure>
  );
}
