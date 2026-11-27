/**
 * Archivo: pages/client/ClientHomePage.tsx
 * Descripción: Menú principal del cliente — el semáforo (RF-009, RF-010, RF-011; HU-009 a HU-011).
 * ¿Para qué? Punto de entrada desde el que el cliente elige qué necesita: una cita de
 *   grooming, reportar un síntoma leve, o ver información de emergencia. Además resume la
 *   ficha de la mascota elegida, sus citas y un producto de la tienda (diseño de Stitch).
 * ¿Impacto? Si el cliente no tiene mascotas registradas, no puede usar 🟢 ni 🟡
 *   (CA-009.2b) — primero debe registrar al menos una. Todo lo que se muestra sale de la
 *   API; si un bloque falla, se oculta sin romper el semáforo.
 */

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PawPrint,
  Plus,
  Sprout,
  Stethoscope,
  Siren,
  ArrowRight,
  CheckCircle2,
  Clock,
  Info,
  MessageCircle,
  AlertTriangle,
  Phone,
  ShoppingBag,
  ChevronRight,
  CalendarPlus,
  ShieldCheck,
  CalendarDays,
} from 'lucide-react';
import * as petsApi from '@/api/pets';
import * as appointmentsApi from '@/api/appointments';
import * as servicesApi from '@/api/services';
import * as productsApi from '@/api/products';
import type { Pet } from '@/types/pets';
import type { Appointment } from '@/types/appointments';
import type { Service } from '@/types/services';
import type { Product } from '@/types/products';
import {
  BEHAVIOR_LABELS,
  COAT_LABELS,
  SIZE_LABELS,
  SKIN_CONDITION_LABELS,
  SPECIES_LABELS,
  formatCOP,
} from '@/types/pricing';
import { useAuth } from '@/hooks/useAuth';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SemaforoLight, type SemaforoTone } from '@/components/ui/SemaforoLight';
import { resolveUploadUrl } from '@/utils/media';
import { BUSINESS } from '@/config/legal';

const WHATSAPP_LINK = `https://wa.me/57${BUSINESS.telefonoDigitos}`;
const MONTHS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

// ¿Qué? Fecha "YYYY-MM-DD" (o ISO) → partes locales, sin desfase por zona horaria.
function dateParts(date: string) {
  const [y, m, d] = date.slice(0, 10).split('-').map(Number);
  return { day: d, month: MONTHS[(m ?? 1) - 1], key: new Date(y, (m ?? 1) - 1, d).getTime() };
}

function PetAvatar({ pet, size = 'md' }: { pet: Pet; size?: 'sm' | 'md' }) {
  const url = resolveUploadUrl(pet.photoUrl);
  const cls = size === 'sm' ? 'h-7 w-7 text-xs' : 'h-14 w-14 text-lg';
  return url ? (
    <img src={url} alt="" className={`${cls} shrink-0 rounded-full object-cover`} />
  ) : (
    <span
      className={`${cls} grid shrink-0 place-items-center rounded-full bg-[color:var(--color-primary)]/15 font-bold text-[color:var(--color-primary)]`}
      aria-hidden="true"
    >
      {pet.name[0]?.toUpperCase()}
    </span>
  );
}

export function ClientHomePage() {
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    petsApi
      .listMyPets()
      .then((list) => {
        setPets(list);
        setSelectedId(list[0]?.id ?? null);
      })
      .catch(() => setPets([]));
    appointmentsApi.listMyAppointments().then(setAppointments).catch(() => setAppointments([]));
    servicesApi.listServices().then(setServices).catch(() => setServices([]));
    productsApi
      .listProducts({ limit: 1 })
      .then((r) => setProduct(r.products[0] ?? null))
      .catch(() => setProduct(null));
  }, []);

  const hasPets = (pets?.length ?? 0) > 0;
  const isLoadingPets = pets === null;
  const pet = pets?.find((p) => p.id === selectedId) ?? null;

  // ¿Qué? Próximas citas primero (más cercana arriba), luego las pasadas (más reciente arriba).
  const recentAppointments = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const t = today.getTime();
    const withKey = appointments.map((a) => ({ a, key: dateParts(a.date).key }));
    const upcoming = withKey.filter((x) => x.key >= t && x.a.status !== 'cancelled').sort((x, y) => x.key - y.key);
    const past = withKey.filter((x) => !upcoming.includes(x)).sort((x, y) => y.key - x.key);
    return [...upcoming, ...past].slice(0, 3).map((x) => x.a);
  }, [appointments]);

  const otherPets = (pets ?? []).filter((p) => p.id !== selectedId);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* ─── Saludo + selector de mascota ─── */}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-xl">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-success)]" aria-hidden="true" />
            Super Amigos Grooming Spa · {BUSINESS.ciudad}
          </p>
          <h1 className="mt-2 flex items-center gap-3 font-display text-3xl font-extrabold text-text sm:text-4xl">
            Hola, {user?.firstName}
            {/* ¿Qué? Ilustración de un cliente con su perro saludando — reemplaza el emoji 👋. */}
            {/*   La imagen tiene fondo blanco: va en un círculo blanco (tipo avatar) para que
                  se vea igual en tema claro y oscuro. */}
            <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-white sm:h-14 sm:w-14">
              <img
                src="/ilustraciones/cliente-saludo.png"
                alt=""
                aria-hidden="true"
                className="h-[85%] w-[85%] object-contain"
              />
            </span>
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-text-muted">
            ¿Cómo se encuentra tu consentido hoy? Elige según su estado en el{' '}
            <strong className="font-semibold text-text">semáforo de cuidado</strong> y te llevamos a
            la atención que necesita.
          </p>
        </div>

        {hasPets && (
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
              Mascota seleccionada
            </p>
            <div className="flex max-w-xl flex-wrap items-center gap-1 rounded-3xl border border-border bg-surface-2 p-1">
              {pets!.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={p.id === selectedId}
                  onClick={() => setSelectedId(p.id)}
                  className={`focus-ring flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-left text-sm transition-colors ${
                    p.id === selectedId ? 'bg-surface shadow-sm' : 'text-text-muted hover:text-text'
                  }`}
                >
                  <PetAvatar pet={p} size="sm" />
                  <span className="leading-tight">
                    <span className="block font-medium text-text">{p.name}</span>
                    <span className="block text-[11px] text-text-muted">
                      {p.breed ?? SPECIES_LABELS[p.species]}
                      {p.weight != null && ` · ${p.weight} kg`}
                    </span>
                  </span>
                </button>
              ))}
              <Link
                to="/app/perfil/mascotas"
                aria-label="Agregar o editar mascotas"
                className="focus-ring grid h-8 w-8 place-items-center rounded-full text-text-muted hover:bg-surface hover:text-text"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {!isLoadingPets && !hasPets && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[color:var(--color-warning)]/30 bg-[color:var(--color-warning-soft)] px-5 py-4 text-sm text-text">
          <span>
            Todavía no tienes mascotas registradas. Regístrala para poder agendar citas y
            reportar síntomas.
          </span>
          <Link
            to="/app/perfil/mascotas"
            className="focus-ring inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-btn)] px-4 py-1.5 text-xs font-semibold text-[color:var(--color-btn-fg)]"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Registrar mascota
          </Link>
        </div>
      )}

      {/* ─── Semáforo ─── */}
      <div className="mt-10 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold text-text">
          <span className="h-5 w-1 rounded-full bg-[color:var(--color-primary)]" aria-hidden="true" />
          Semáforo de cuidado
        </h2>
        {pet && (
          <span className="rounded-full border border-border px-3 py-1 text-xs text-text-muted">
            Selección para {pet.name}
          </span>
        )}
      </div>

      <div className="mt-4 grid gap-5 md:grid-cols-3">
        <SemaforoCard
          tone="success"
          tag="Sin síntomas · bienestar"
          level="Nivel verde"
          icon={Sprout}
          title="Cita de Grooming"
          description="Tu mascota está bien y quiere verse bonita: baño, spa o corte con cita previa."
          info={[
            { icon: CheckCircle2, text: 'Ves el precio antes de confirmar' },
            { icon: Clock, text: 'Agenda en línea las 24 horas' },
          ]}
          to={pet ? `/app/cita?mascota=${pet.id}` : '/app/cita'}
          cta={pet ? `Agendar spa para ${pet.name}` : 'Agendar cita'}
          disabled={!hasPets}
        />
        <SemaforoCard
          tone="info"
          tag="Revisión por la auxiliar"
          level="Nivel amarillo"
          icon={Stethoscope}
          title="Síntoma Leve"
          description="Rascado, enrojecimiento, lagañas, olor en oídos o un cambio en su conducta."
          info={[
            { icon: Info, text: 'Nuestra auxiliar en veterinaria lo revisa' },
            { icon: MessageCircle, text: 'Te orientamos sobre el siguiente paso' },
          ]}
          to="/app/sintoma"
          cta="Reportar síntoma"
          disabled={!hasPets}
        />
        <SemaforoCard
          tone="accent"
          tag="Atención urgente"
          level="Nivel rojo"
          icon={Siren}
          title="Emergencia"
          description="Dificultad para respirar, convulsiones, sangrado o una herida profunda."
          info={[
            { icon: AlertTriangle, text: 'No programes grooming en este estado' },
            { icon: Phone, text: 'Te mostramos a dónde acudir ya' },
          ]}
          to="/app/emergencia"
          cta="Ver qué hacer ahora"
          alert
        />
      </div>

      {/* ─── Ficha activa + tienda ─── */}
      <div className="mt-8 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        {pet ? (
          <section className="card rounded-3xl p-6" aria-label={`Ficha de ${pet.name}`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <PetAvatar pet={pet} />
                <div>
                  <p className="font-display text-xl font-bold text-text">Ficha activa: {pet.name}</p>
                  <p className="mt-0.5 text-sm text-text-muted">
                    {[
                      SPECIES_LABELS[pet.species],
                      pet.breed,
                      pet.age != null ? `${pet.age} ${pet.age === 1 ? 'año' : 'años'}` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
              </div>
              <Link
                to="/app/perfil/mascotas"
                className="focus-ring inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm text-text hover:underline"
              >
                Ver ficha completa <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <FichaStat label="Peso" value={pet.weight != null ? `${pet.weight} kg` : '—'} />
              <FichaStat label="Tamaño" value={pet.size ? SIZE_LABELS[pet.size] : 'Por definir'} />
              <FichaStat label="Pelaje" value={pet.coatType ? COAT_LABELS[pet.coatType] : 'Por definir'} />
              <FichaStat
                label="Comportamiento"
                value={pet.behavior ? BEHAVIOR_LABELS[pet.behavior] : 'Por definir'}
              />
            </dl>

            <div className="mt-4 rounded-2xl bg-surface-2 p-4 text-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
                Cuidados especiales
              </p>
              {pet.skinConditions.length === 0 && !pet.pathology ? (
                <p className="mt-1 text-text">Sin condiciones de piel ni patologías registradas.</p>
              ) : (
                <>
                  {pet.skinConditions.length > 0 && (
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {pet.skinConditions.map((c) => (
                        <li
                          key={c.type}
                          className="rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs text-text"
                        >
                          {SKIN_CONDITION_LABELS[c.type]}
                        </li>
                      ))}
                    </ul>
                  )}
                  {pet.pathology && <p className="mt-2 italic text-text">“{pet.pathology}”</p>}
                </>
              )}
            </div>
          </section>
        ) : (
          <div className="hidden lg:block" />
        )}

        <section className="card flex flex-col rounded-3xl p-6" aria-label="Tienda">
          <div className="flex items-start justify-between">
            <span className="rounded-full bg-[color:var(--color-info-soft)] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[color:var(--color-info)]">
              Recoges en el local
            </span>
            <ShoppingBag className="h-5 w-5 text-text-muted" aria-hidden="true" />
          </div>
          <p className="mt-4 font-display text-lg font-bold text-text">Tienda Super Amigos</p>
          <p className="mt-1 text-sm leading-relaxed text-text-muted">
            Juguetes, accesorios y productos de cuidado. Pide en línea y paga al recoger.
          </p>
          {product && (
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-border bg-surface-2 p-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface text-[color:var(--color-primary)]">
                <PawPrint className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-text">{product.name}</p>
                <p className="text-xs text-text-muted">{formatCOP(product.price)} COP</p>
              </div>
            </div>
          )}
          <div className="min-h-5 flex-1" />
          <Link
            to="/app/tienda"
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-surface-2 px-4 py-2.5 text-sm font-medium text-text hover:bg-border/60"
          >
            Explorar catálogo <ShoppingBag className="h-4 w-4" aria-hidden="true" />
          </Link>
        </section>
      </div>

      {/* ─── Citas ─── */}
      <div className="mt-10 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold text-text">
          <span className="h-5 w-1 rounded-full bg-[color:var(--color-primary)]" aria-hidden="true" />
          Citas y servicios de {user?.firstName}
        </h2>
        <Link to="/app/perfil/historial" className="focus-ring rounded text-xs text-text-muted hover:text-text">
          Ver historial completo
        </Link>
      </div>

      <div className="mt-4 space-y-3">
        {recentAppointments.length === 0 ? (
          <div className="card flex items-center gap-3 rounded-2xl p-5 text-sm text-text-muted">
            <CalendarDays className="h-5 w-5" aria-hidden="true" />
            Aún no tienes citas. Cuando agendes una, la verás aquí.
          </div>
        ) : (
          recentAppointments.map((a) => {
            const { day, month } = dateParts(a.date);
            const service = services.find((s) => s.id === a.serviceId);
            const apptPet = pets?.find((p) => p.id === a.petId);
            return (
              <div key={a.id} className="card flex flex-wrap items-center gap-4 rounded-2xl p-4 sm:flex-nowrap">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-surface-2 text-center leading-none">
                  <span>
                    <span className="block font-display text-xl font-bold text-text">{day}</span>
                    <span className="mt-1 block text-[10px] font-semibold text-text-muted">{month}</span>
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-text">{service?.name ?? 'Servicio de grooming'}</p>
                    <StatusBadge status={a.status} />
                    {apptPet && (
                      <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-text-muted">
                        {apptPet.name}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-text-muted">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    {a.time.slice(0, 5)}
                    {service && ` · ${service.durationMinutes} min`}
                  </p>
                </div>
                {a.totalPrice != null && (
                  <div className="text-right">
                    <p className="text-[11px] text-text-muted">Total servicio</p>
                    <p className="font-display text-lg font-bold text-text">{formatCOP(a.totalPrice)} COP</p>
                  </div>
                )}
              </div>
            );
          })
        )}

        {hasPets && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface-2/70 p-4">
            <p className="flex items-center gap-3 text-sm text-text">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-surface text-[color:var(--color-primary)]">
                <CalendarPlus className="h-4 w-4" aria-hidden="true" />
              </span>
              {otherPets.length > 0
                ? `¿Necesitas agendar también para ${otherPets.length === 1 ? otherPets[0].name : `${otherPets[0].name} u otra de tus mascotas`}?`
                : '¿Quieres reservar el próximo turno?'}
            </p>
            <Link
              to={otherPets.length === 1 ? `/app/cita?mascota=${otherPets[0].id}` : '/app/cita'}
              className="focus-ring inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-btn)] px-4 py-2 text-sm font-semibold text-[color:var(--color-btn-fg)] hover:bg-[color:var(--color-btn-hover)]"
            >
              <Plus className="h-4 w-4" aria-hidden="true" /> Agendar cita nueva
            </Link>
          </div>
        )}
      </div>

      {/* ─── Aviso de alcance ─── */}
      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border bg-surface-2/60 p-6">
        <div className="flex max-w-3xl items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[color:var(--color-info-soft)] text-[color:var(--color-info)]">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-display font-bold text-text">Cuidado responsable</p>
            <p className="mt-1 text-sm leading-relaxed text-text-muted">
              No somos una clínica veterinaria. Nuestra auxiliar revisa síntomas leves y te
              orienta; para diagnósticos, tratamientos o emergencias te dirigimos a un centro
              veterinario.
            </p>
          </div>
        </div>
        <a
          href={WHATSAPP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-text hover:bg-surface-2"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" /> Dudas por WhatsApp
        </a>
      </div>
    </div>
  );
}

function FichaStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-2/60 p-3">
      <dt className="text-[11px] uppercase tracking-wider text-text-muted">{label}</dt>
      <dd className="mt-1 font-display text-base font-bold text-text">{value}</dd>
    </div>
  );
}

type Tone = 'success' | 'info' | 'accent';

const TONES: Record<Tone, { light: SemaforoTone; tag: string; icon: string; btn: string }> = {
  success: {
    light: 'verde',
    tag: 'bg-[color:var(--color-success-soft)] text-[color:var(--color-success)]',
    icon: 'bg-[color:var(--color-success-soft)] text-[color:var(--color-success)]',
    btn: 'bg-[color:var(--color-btn)] text-[color:var(--color-btn-fg)] hover:bg-[color:var(--color-btn-hover)]',
  },
  info: {
    light: 'amarillo',
    tag: 'bg-[color:var(--color-info-soft)] text-[color:var(--color-info)]',
    icon: 'bg-[color:var(--color-info-soft)] text-[color:var(--color-info)]',
    btn: 'bg-[color:var(--color-info)] text-white dark:text-[#111] hover:opacity-90',
  },
  accent: {
    light: 'rojo',
    tag: 'bg-[color:var(--color-accent-soft)] text-[color:var(--color-danger)]',
    icon: 'bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]',
    btn: 'bg-[color:var(--color-accent)] text-[#2a120c] hover:opacity-90',
  },
};

interface SemaforoCardProps {
  tone: Tone;
  tag: string;
  level: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  info: { icon: React.ComponentType<{ className?: string }>; text: string }[];
  to: string;
  cta: string;
  disabled?: boolean;
  alert?: boolean;
}

function SemaforoCard({
  tone,
  tag,
  level,
  icon: Icon,
  title,
  description,
  info,
  to,
  cta,
  disabled,
  alert,
}: SemaforoCardProps) {
  const t = TONES[tone];
  return (
    <div className={`card group flex flex-col rounded-3xl p-5 ${disabled ? 'opacity-55' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${t.tag}`}>
          {/* ¿Qué? La luz titila al pasar el puntero (o el foco del teclado) por el botón de la tarjeta. */}
          <SemaforoLight tone={t.light} blink="card" />
          {tag}
        </span>
        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-text-muted">{level}</span>
      </div>
      <div className="mt-5 flex items-center gap-3">
        <span className={`grid h-11 w-11 place-items-center rounded-2xl ${t.icon}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="font-display text-lg font-bold text-text">{title}</p>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-text-muted">{description}</p>
      <ul
        className={`mt-4 space-y-1.5 rounded-2xl p-3 text-xs ${
          alert ? 'bg-[color:var(--color-accent-soft)] text-text' : 'bg-surface-2 text-text-muted'
        }`}
      >
        {info.map(({ icon: I, text }) => (
          <li key={text} className="flex items-center gap-2">
            <I className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> {text}
          </li>
        ))}
      </ul>
      <div className="mt-5 flex-1" />
      {disabled ? (
        <span
          aria-disabled="true"
          className="inline-flex cursor-not-allowed items-center justify-between gap-2 rounded-full bg-surface-2 px-4 py-2.5 text-sm font-medium text-text-muted"
        >
          <span className="min-w-0 truncate">{cta}</span>
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        </span>
      ) : (
        <Link
          to={to}
          title={cta}
          className={`focus-ring inline-flex items-center justify-between gap-2 rounded-full px-4 py-2.5 text-sm font-semibold ${t.btn}`}
        >
          {/* ¿Qué? Nombres largos se cortan con "…" en vez de partir el botón en dos líneas. */}
          <span className="min-w-0 truncate">{cta}</span>
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
