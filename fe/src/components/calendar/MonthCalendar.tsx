/**
 * Archivo: components/calendar/MonthCalendar.tsx
 * Descripción: Calendario mensual dependency-free (sin librería externa), igual de "sin
 *   dependencias" que los gráficos de fe/src/components/charts/ (BarChart, TrendChart).
 * ¿Para qué? El dashboard del perfil de cliente necesita ver de un vistazo en qué días tiene
 *   citas agendadas, navegar entre meses y elegir un día para ver el detalle debajo.
 * ¿Impacto? No sabe nada de "citas" — solo recibe un mapa de fecha ('YYYY-MM-DD') → cantidad
 *   de eventos ese día, así que sirve para cualquier lista con fecha, no solo Appointment.
 */

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const WEEKDAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MONTH_LABEL = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' });

function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ¿Qué? Lunes = 0 ... Domingo = 6 (getDay() nativo empieza en domingo=0).
function mondayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

interface MonthCalendarProps {
  // ¿Qué? 'YYYY-MM-DD' → cantidad de eventos ese día.
  eventDates: Record<string, number>;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  // ¿Qué? Días que no se pueden elegir (llenos, o fuera de rango) — se ven tachados y no
  //   responden al clic. No afecta el punto de "eventDates", que sigue siendo informativo.
  disabledDates?: Set<string>;
  // ¿Qué? Ningún día ANTERIOR a esta fecha ('YYYY-MM-DD') se puede seleccionar.
  minDate?: string;
  // ¿Qué? Avisa al padre qué mes quedó visible — para que pueda pedir datos (p. ej.
  //   disponibilidad) de ESE mes en vez de traer todo de una vez. Se dispara también al montar.
  onMonthChange?: (year: number, month: number) => void;
}

export function MonthCalendar({
  eventDates,
  selectedDate,
  onSelectDate,
  disabledDates,
  minDate,
  onMonthChange,
}: MonthCalendarProps) {
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  useEffect(() => {
    onMonthChange?.(viewMonth.getFullYear(), viewMonth.getMonth());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMonth]);

  const todayKey = toDateKey(new Date());
  const firstOfMonth = viewMonth;
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const leadingBlanks = mondayIndex(firstOfMonth);

  const cells: (Date | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(viewMonth.getFullYear(), viewMonth.getMonth(), i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const goToMonth = (delta: number) => {
    setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
  };

  const goToday = () => {
    const now = new Date();
    setViewMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    const todayAllowed = (minDate == null || todayKey >= minDate) && !disabledDates?.has(todayKey);
    if (todayAllowed) onSelectDate(todayKey);
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="font-display text-sm font-bold text-text">{capitalizeFirst(MONTH_LABEL.format(viewMonth))}</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goToday}
            className="focus-ring rounded-lg px-2 py-1 text-xs font-medium text-[color:var(--color-primary)] hover:bg-surface-2"
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => goToMonth(-1)}
            aria-label="Mes anterior"
            className="focus-ring rounded-lg p-1.5 text-text-muted hover:bg-surface-2 hover:text-text"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => goToMonth(1)}
            aria-label="Mes siguiente"
            className="focus-ring rounded-lg p-1.5 text-text-muted hover:bg-surface-2 hover:text-text"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase text-text-muted">
        {WEEKDAY_LABELS.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <span key={i} aria-hidden="true" />;
          const key = toDateKey(date);
          const count = eventDates[key] ?? 0;
          const isToday = key === todayKey;
          const isSelected = key === selectedDate;
          const isDisabled = (minDate != null && key < minDate) || (disabledDates?.has(key) ?? false);

          return (
            <button
              key={key}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelectDate(key)}
              aria-pressed={isSelected}
              aria-label={`${date.getDate()} de ${MONTH_LABEL.format(date)}${
                isDisabled ? ', sin cupo' : count > 0 ? `, ${count} cita(s)` : ''
              }`}
              className={[
                'focus-ring relative aspect-square rounded-lg text-sm transition-colors',
                isDisabled
                  ? 'cursor-not-allowed text-text-muted/40 line-through'
                  : isSelected
                    ? 'bg-[color:var(--color-primary)] text-white font-semibold'
                    : isToday
                      ? 'bg-surface-2 font-semibold text-text'
                      : 'text-text hover:bg-surface-2',
              ].join(' ')}
            >
              {date.getDate()}
              {!isDisabled && count > 0 && (
                <span
                  className={[
                    'absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full',
                    isSelected ? 'bg-white' : 'bg-[color:var(--color-accent)]',
                  ].join(' ')}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
