/**
 * Archivo: pages/LandingPage.tsx
 * Descripción: Página pública de bienvenida — enfoque comercial (diseño de Google Stitch).
 * ¿Para qué? Explicar en un vistazo qué es Super Amigos Grooming Spa, qué servicios ofrece,
 *   cuánto cuesta (cotizador con el tarifario real), por qué elegirlo y cómo empezar.
 *   Deja explícito que NO es una clínica veterinaria (regla de negocio).
 * ¿Impacto? Los precios salen de la API (/services y /pricing/public); si no responde, las
 *   tarjetas se muestran sin precio y el cotizador queda oculto.
 */

import { useEffect, useMemo, useState } from 'react';
import {
  PawPrint,
  Scissors,
  Bath,
  Stethoscope,
  ShoppingBag,
  CalendarCheck,
  ShieldCheck,
  Star,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Tag,
  ClipboardList,
  Clock,
  MessageCircle,
  Calculator,
  Check,
  MapPin,
  Dog,
  Cat,
  Sparkles,
  HeartHandshake,
} from 'lucide-react';
import { useAuthModal } from '@/hooks/useAuthModal';
import { TRUST_STATS } from '@/config/landing';
import { BUSINESS } from '@/config/legal';
import { TESTIMONIALS } from '@/data/testimonials';
import * as servicesApi from '@/api/services';
import * as pricingApi from '@/api/pricing';
import type { Service } from '@/types/services';
import type { PetSize, PetSpecies } from '@/types/pets';
import { formatCOP, type PublicPricing } from '@/types/pricing';

const GALLERY = Array.from({ length: 12 }, (_, i) => `/galeria/perro${i + 1}.jpg.jpeg`);
const WHATSAPP_LINK = `https://wa.me/57${BUSINESS.telefonoDigitos}`;
const MAPS_LINK = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(BUSINESS.direccion)}`;

// ¿Qué? Servicios "de vitrina" — el precio real se completa desde la API si hay match por
//   nombre; si no, se muestra el texto de `fallback`.
const SERVICE_CARDS = [
  {
    icon: Bath,
    name: 'Baño & Spa',
    match: /ba(ñ|n)o|spa/i,
    desc: 'Baño con productos según su piel, secado sin estrés, cepillado y perfume.',
    bullets: ['Shampoo según su tipo de piel', 'Secado y cepillado completo'],
    fallback: 'Con cita previa',
  },
  {
    icon: Scissors,
    name: 'Peluquería & Corte',
    match: /corte|peluquer|estilo/i,
    desc: 'Corte de raza o a tu gusto, arreglo de cara, patas y zona sanitaria.',
    bullets: ['Corte de raza o personalizado', 'Arreglo de uñas y almohadillas'],
    fallback: 'Con cita previa',
  },
  {
    icon: Stethoscope,
    name: 'Revisión de síntomas leves',
    match: null,
    desc: 'Nuestra auxiliar en veterinaria revisa síntomas leves y te orienta.',
    bullets: ['Reporte desde la app con foto', 'Te decimos si conviene ir al veterinario'],
    fallback: 'Desde tu cuenta',
  },
  {
    icon: ShoppingBag,
    name: 'Tienda para mascotas',
    match: null,
    desc: 'Juguetes, accesorios y productos de cuidado, listos para recoger.',
    bullets: ['Pides en línea', 'Pagas y recoges en el local'],
    fallback: 'En sede',
  },
];

// ¿Qué? Diferenciadores frente a agendar "por WhatsApp" o llevar la mascota sin cita.
const WHY_US = [
  { icon: Tag, title: 'Precio claro antes de agendar', text: 'Ves el estimado según tu mascota — talla, pelaje y condiciones — antes de confirmar. Sin sorpresas al recoger.' },
  { icon: ClipboardList, title: 'Ficha de cuidado por mascota', text: 'Cada mascota tiene su ficha: peso, pelaje, condiciones de piel y comportamiento, siempre a mano para el equipo.' },
  { icon: Stethoscope, title: 'Auxiliar en veterinaria disponible', text: 'Si notas un síntoma leve, lo reportas desde la app y te orientamos — sin llevarla en persona para una duda simple.' },
  { icon: Clock, title: 'Agenda en minutos, paga al recoger', text: 'Reserva tu horario en línea las 24 horas. Confirmamos la cita y pagas en el local cuando recoges a tu consentido.' },
];

const STEPS = [
  { icon: PawPrint, title: 'Crea tu cuenta y su ficha', text: 'Regístrate gratis y registra a tu mascota con su peso, pelaje y cuidados especiales.' },
  { icon: CalendarCheck, title: 'Agenda en línea', text: 'Elige servicio y horario. Ves el precio estimado antes de confirmar.' },
  { icon: ShieldCheck, title: 'Recoge feliz y paga', text: 'Te avisamos cuando esté lista. Pagas al recoger, en el local.' },
];

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex" aria-label={`${rating} de 5 estrellas`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < rating ? 'fill-[color:var(--color-accent)] text-[color:var(--color-accent)]' : 'text-border'}`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-primary)]">
      {children}
    </p>
  );
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function LandingPage() {
  const { open: openAuthModal } = useAuthModal();
  const [services, setServices] = useState<Service[]>([]);
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    servicesApi.listServices().then(setServices).catch(() => setServices([]));
  }, []);

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null);
      if (e.key === 'ArrowRight') setLightbox((i) => (i === null ? i : (i + 1) % GALLERY.length));
      if (e.key === 'ArrowLeft') setLightbox((i) => (i === null ? i : (i - 1 + GALLERY.length) % GALLERY.length));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox]);

  const priceFor = (match: RegExp | null): number | null => {
    if (!match) return null;
    const found = services.filter((s) => match.test(s.name)).sort((a, b) => a.price - b.price)[0];
    return found ? found.price : null;
  };

  const rating = TRUST_STATS.find((s) => /calificaci/i.test(s.label))?.value;

  return (
    <div className="bg-bg pb-16 sm:pb-0">
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-text-muted">
              <PawPrint className="h-3.5 w-3.5 text-[color:var(--color-primary)]" aria-hidden="true" />
              Peluquería y spa especializado · {BUSINESS.ciudad}
            </span>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.1] text-text sm:text-5xl lg:text-[3.4rem]">
              Tu mascota consentida, relajada y{' '}
              <span className="relative whitespace-nowrap text-[color:var(--color-primary)]">
                como nueva
                <span
                  className="absolute inset-x-0 -bottom-1 h-2 rounded-full bg-[color:var(--color-primary)]/20"
                  aria-hidden="true"
                />
              </span>
              .
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-text-muted">
              Baño, spa y corte con productos según la piel de tu mascota y secado sin estrés.
              Mira el precio antes de reservar, agenda en línea y lleva su ficha de cuidado al día.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => openAuthModal('register')}
                className="focus-ring inline-flex items-center gap-2 rounded-full bg-[color:var(--color-btn)] px-5 py-2.5 text-sm font-semibold text-[color:var(--color-btn-fg)] shadow-sm hover:bg-[color:var(--color-btn-hover)]"
              >
                <CalendarCheck className="h-4 w-4" aria-hidden="true" />
                Agendar cita en línea
              </button>
              <a
                href="#cotizador"
                className="focus-ring inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-medium text-text hover:bg-surface-2"
              >
                <Calculator className="h-4 w-4" aria-hidden="true" />
                Cotizar servicio
              </a>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring inline-flex items-center gap-2 rounded-full bg-[color:var(--color-accent-soft)] px-5 py-2.5 text-sm font-medium text-text hover:opacity-90"
              >
                <MessageCircle className="h-4 w-4 text-[color:var(--color-accent)]" aria-hidden="true" />
                WhatsApp directo
              </a>
            </div>
            <ul className="mt-6 flex flex-wrap gap-2 text-xs text-text-muted">
              {['100% con cita previa', 'Auxiliar en veterinaria', 'Ficha de cuidado por mascota'].map((t) => (
                <li key={t} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1">
                  <Check className="h-3.5 w-3.5 text-[color:var(--color-success)]" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-text-muted">
              ¿Ya tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="font-semibold text-[color:var(--color-primary)] hover:underline"
              >
                Inicia sesión
              </button>
            </p>
          </div>

          {/* Collage de fotos */}
          <div className="relative grid grid-cols-2 gap-4">
            {GALLERY.slice(0, 3).map((src, i) => (
              <button
                key={src}
                onClick={() => setLightbox(i)}
                aria-label="Ver foto ampliada"
                className={`focus-ring overflow-hidden rounded-3xl border border-border shadow-[var(--sh-card)] ${
                  i === 0 ? 'row-span-2 aspect-[3/4] self-center' : 'aspect-square'
                }`}
              >
                <img
                  src={src}
                  alt="Mascota atendida en Super Amigos Grooming Spa"
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </button>
            ))}
            {rating && (
              <div className="card absolute -bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-2xl px-4 py-3 sm:left-auto sm:right-4 sm:translate-x-0">
                <span className="font-display text-2xl font-extrabold text-text">{rating}</span>
                <div>
                  <Stars rating={5} />
                  <p className="mt-0.5 text-[11px] text-text-muted">Calificación promedio</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── Confianza ─── */}
      <section className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {TRUST_STATS.map((s) => (
            <div key={s.label} className="card px-5 py-5 text-center">
              <p className="font-display text-3xl font-extrabold text-text">{s.value}</p>
              <p className="mt-1 text-xs text-text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Servicios ─── */}
      <section id="servicios" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>Experiencia wellness canina y felina</Eyebrow>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-text sm:text-4xl">
            Todo lo que tu consentido necesita para verse y sentirse feliz
          </h2>
          <p className="mt-3 text-sm text-text-muted">
            Cuidado estético y preventivo con productos según su piel, en un ambiente tranquilo.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICE_CARDS.map(({ icon: Icon, name, desc, bullets, match, fallback }) => {
            const price = priceFor(match);
            return (
              <div key={name} className="card flex flex-col rounded-3xl p-6">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[color:var(--color-primary)]/12 text-[color:var(--color-primary)]">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className="mt-5 font-display text-lg font-bold text-text">{name}</p>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">{desc}</p>
                <ul className="mt-4 flex-1 space-y-1.5 text-xs text-text-muted">
                  {bullets.map((b) => (
                    <li key={b} className="flex items-start gap-1.5">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--color-success)]" aria-hidden="true" />
                      {b}
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex items-end justify-between border-t border-border pt-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-text-muted">
                      {price != null ? 'Inversión' : 'Disponible'}
                    </p>
                    <p className="font-display text-lg font-bold text-text">
                      {price != null ? `Desde ${formatCOP(price)}` : fallback}
                    </p>
                  </div>
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-text-muted" aria-hidden="true">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── Cotizador ─── */}
      <PriceCalculator onBook={() => openAuthModal('register')} />

      {/* ─── Por qué elegirnos ─── */}
      <section id="por-que" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>Diferencial Super Amigos</Eyebrow>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-text sm:text-4xl">
            Por qué no somos solo una peluquería más
          </h2>
          <p className="mt-3 text-sm text-text-muted">
            Así cuidamos a tu mascota de principio a fin.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {WHY_US.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card flex gap-4 rounded-3xl p-6">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[color:var(--color-primary)]/12 text-[color:var(--color-primary)]">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-display font-bold text-text">{title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-text-muted">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Cómo funciona ─── */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>Proceso ágil</Eyebrow>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-text sm:text-4xl">
            Consentir a tu mejor amigo toma 3 pasos
          </h2>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <div key={title} className="card rounded-3xl p-6">
              <div className="flex items-start justify-between">
                <span className="font-display text-4xl font-extrabold text-[color:var(--color-primary)]/35">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="grid h-10 w-10 place-items-center rounded-full bg-surface-2 text-[color:var(--color-primary)]">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
              </div>
              <p className="mt-4 font-display font-bold text-text">{title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Galería ─── */}
      <section id="galeria" className="scroll-mt-20 bg-surface-2/60">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <Eyebrow>Book de consentidos</Eyebrow>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-text sm:text-4xl">
            Algunos de nuestros consentidos
          </h2>
          <p className="mt-2 text-sm text-text-muted">Toca una foto para verla más grande.</p>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {GALLERY.map((src, i) => (
              <button
                key={src}
                onClick={() => setLightbox(i)}
                aria-label={`Ver foto ${i + 1} ampliada`}
                className="focus-ring group aspect-[4/5] overflow-hidden rounded-3xl border border-border"
              >
                <img
                  src={src}
                  alt="Mascota atendida en Super Amigos Grooming Spa"
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonios ─── */}
      <section id="testimonios" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>Familias tranquilas</Eyebrow>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-text sm:text-4xl">
            Lo que dicen los papás de nuestros consentidos
          </h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="card flex flex-col rounded-3xl p-6">
              <Stars rating={t.rating} />
              <blockquote className="mt-4 flex-1 text-sm italic leading-relaxed text-text">“{t.quote}”</blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-border pt-4">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-xs font-bold text-[color:var(--color-primary)]">
                  {initials(t.name)}
                </span>
                <span className="text-xs text-text-muted">
                  <span className="block text-sm font-semibold text-text">{t.name}</span>
                  {t.pet}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ─── CTA final + sede ─── */}
      <section id="contacto" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-20 sm:px-6">
        <div className="card grid gap-10 rounded-[2rem] p-6 sm:p-10 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-text-muted">
              <Sparkles className="h-3.5 w-3.5 text-[color:var(--color-primary)]" aria-hidden="true" />
              Atención personalizada con cita previa
            </span>
            <h2 className="mt-4 font-display text-3xl font-extrabold leading-tight text-text sm:text-4xl">
              ¿Listo para que tu mascota viva su{' '}
              <span className="text-[color:var(--color-primary)]">día de spa soñado</span>?
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-text-muted">
              Crea tu cuenta gratis y agenda su turno en minutos. Pagas al recoger a tu consentido.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => openAuthModal('register')}
                className="focus-ring inline-flex items-center gap-2 rounded-full bg-[color:var(--color-btn)] px-5 py-2.5 text-sm font-semibold text-[color:var(--color-btn-fg)] hover:bg-[color:var(--color-btn-hover)]"
              >
                <CalendarCheck className="h-4 w-4" aria-hidden="true" />
                Agendar cita ahora
              </button>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring inline-flex items-center gap-2 rounded-full bg-[color:var(--color-accent-soft)] px-5 py-2.5 text-sm font-medium text-text hover:opacity-90"
              >
                <MessageCircle className="h-4 w-4 text-[color:var(--color-accent)]" aria-hidden="true" />
                Consultar por WhatsApp
              </a>
            </div>
            <p className="mt-6 flex items-start gap-2 rounded-2xl bg-[color:var(--color-warning-soft)] p-4 text-xs leading-relaxed text-text">
              <HeartHandshake className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--color-warning)]" aria-hidden="true" />
              <span>
                <strong className="font-semibold">No somos una clínica veterinaria.</strong> Nuestra
                auxiliar revisa síntomas leves y te orienta; para diagnósticos, tratamientos o
                emergencias te dirigimos a un centro veterinario.
              </span>
            </p>
          </div>

          <div className="rounded-3xl border border-border bg-surface-2/60 p-6">
            <p className="flex items-center gap-2 font-display font-bold text-text">
              <MapPin className="h-4 w-4 text-[color:var(--color-primary)]" aria-hidden="true" />
              Sede {BUSINESS.ciudad}
            </p>
            <a
              href={MAPS_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring mt-4 grid h-32 place-items-center rounded-2xl border border-dashed border-border bg-surface text-center text-sm text-text hover:bg-surface-2"
            >
              <span>
                <MapPin className="mx-auto h-6 w-6 text-[color:var(--color-accent)]" aria-hidden="true" />
                <span className="mt-1 block px-4">{BUSINESS.direccion}</span>
                <span className="mt-1 block text-xs text-[color:var(--color-primary)]">Ver en el mapa</span>
              </span>
            </a>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex items-start justify-between gap-4">
                <dt className="flex items-center gap-2 text-text-muted">
                  <Clock className="h-4 w-4" aria-hidden="true" /> Horario
                </dt>
                <dd className="text-right text-text">{BUSINESS.horario}</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="flex items-center gap-2 text-text-muted">
                  <MessageCircle className="h-4 w-4" aria-hidden="true" /> WhatsApp
                </dt>
                <dd className="text-right text-text">{BUSINESS.telefono}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* ─── CTA fija — solo móvil ─── */}
      {/* ¿Qué? En pantallas largas, el CTA queda lejos del pulgar mientras se hace scroll.
         Esta barra lo mantiene a mano en móvil; se oculta desde `sm:`. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 p-3 backdrop-blur sm:hidden">
        <button
          type="button"
          onClick={() => openAuthModal('register')}
          className="focus-ring flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--color-btn)] px-5 py-2.5 text-sm font-semibold text-[color:var(--color-btn-fg)]"
        >
          Crear cuenta gratis
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* ─── Lightbox ─── */}
      {lightbox !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Foto ampliada"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            aria-label="Cerrar"
            className="absolute right-4 top-4 rounded-full p-2 text-white hover:bg-white/10"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((i) => (i === null ? i : (i - 1 + GALLERY.length) % GALLERY.length));
            }}
            aria-label="Anterior"
            className="absolute left-2 rounded-full p-2 text-white hover:bg-white/10 sm:left-6"
          >
            <ChevronLeft className="h-7 w-7" aria-hidden="true" />
          </button>
          <img
            src={GALLERY[lightbox]}
            alt="Mascota atendida en Super Amigos Grooming Spa"
            className="max-h-[85vh] max-w-full rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((i) => (i === null ? i : (i + 1) % GALLERY.length));
            }}
            aria-label="Siguiente"
            className="absolute right-2 rounded-full p-2 text-white hover:bg-white/10 sm:right-6"
          >
            <ChevronRight className="h-7 w-7" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ───────────── Cotizador ─────────────
 * ¿Qué? Calcula el precio base del grooming con el tarifario público (RF-014):
 *   base del servicio + recargo por tamaño + recargo por pelaje (+ nudos si aplica).
 * ¿Para qué? Que el visitante vea un estimado real antes de crear la cuenta.
 * ¿Impacto? Las demás condiciones de piel y el comportamiento se evalúan en la ficha;
 *   por eso se muestra como "estimado" y lo aclara debajo del total. */
const SIZES: PetSize[] = ['pequeno', 'mediano', 'grande', 'gigante'];

function PriceCalculator({ onBook }: { onBook: () => void }) {
  const [pricing, setPricing] = useState<PublicPricing | null>(null);
  const [species, setSpecies] = useState<PetSpecies>('canina');
  const [size, setSize] = useState<PetSize>('pequeno');
  const [serviceId, setServiceId] = useState<string>('');
  const [longCoat, setLongCoat] = useState(false);
  const [knots, setKnots] = useState(false);

  useEffect(() => {
    pricingApi
      .getPublicPricing()
      .then((p) => {
        setPricing(p);
        setServiceId(p.services[0]?.id ?? '');
      })
      .catch(() => setPricing(null));
  }, []);

  const tiers = useMemo(
    () => (pricing?.sizeTiers ?? []).filter((t) => t.species === species),
    [pricing, species],
  );
  const service = pricing?.services.find((s) => s.id === serviceId);
  const knotsRule = pricing?.skinSurcharges.find((r) => r.type === 'nudos');

  if (!pricing || pricing.services.length === 0 || !service) return null;

  const sizeAmount =
    service.sizeModifiers.find((m) => m.species === species && m.size === size)?.amount ?? 0;
  const coatAmount =
    service.coatModifiers.find((m) => m.species === species && m.coatType === (longCoat ? 'largo' : 'corto'))
      ?.amount ?? 0;
  const knotsAmount = knots && knotsRule ? knotsRule.amount : 0;
  const total = service.basePrice + sizeAmount + coatAmount + knotsAmount;

  const tierLabel = (s: PetSize) => {
    const idx = tiers.findIndex((t) => t.size === s);
    const t = tiers[idx];
    if (!t) return '';
    const prev = idx > 0 ? tiers[idx - 1].maxWeight : null;
    if (t.maxWeight == null) return prev != null ? `+${prev} kg` : '';
    return prev == null ? `hasta ${t.maxWeight} kg` : `${prev}–${t.maxWeight} kg`;
  };

  const chip = (active: boolean) =>
    `focus-ring rounded-2xl border px-3 py-2.5 text-sm transition-colors ${
      active
        ? 'border-[color:var(--color-btn)] bg-[color:var(--color-btn)] text-[color:var(--color-btn-fg)]'
        : 'border-border bg-surface text-text hover:bg-surface-2'
    }`;

  const row = (label: string, value: string) => (
    <div className="flex items-center justify-between gap-4 border-b border-border py-2.5 text-sm last:border-0">
      <span className="text-text-muted">{label}</span>
      <span className="text-right font-medium text-text">{value}</span>
    </div>
  );

  return (
    <section id="cotizador" className="scroll-mt-20 px-4 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-8 rounded-[2rem] border border-border bg-surface-2/70 p-6 sm:p-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <Eyebrow>Cotizador en línea</Eyebrow>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-text">
            Calcula el precio de tu consentido
          </h2>
          <p className="mt-2 text-sm text-text-muted">
            Sin compromiso. Con el tarifario vigente del spa.
          </p>

          <fieldset className="mt-8">
            <legend className="text-sm font-semibold text-text">1. ¿Quién nos visita?</legend>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {([
                ['canina', 'Perro', Dog],
                ['felina', 'Gato', Cat],
              ] as const).map(([value, label, Icon]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={species === value}
                  onClick={() => setSpecies(value)}
                  className={`${chip(species === value)} flex items-center justify-center gap-2`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" /> {label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-6">
            <legend className="text-sm font-semibold text-text">2. Tamaño aproximado</legend>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={size === s}
                  onClick={() => setSize(s)}
                  className={chip(size === s)}
                >
                  <span className="block font-medium">{tiers.find((t) => t.size === s)?.label ?? s}</span>
                  <span className="block text-[11px] opacity-75">{tierLabel(s)}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-6">
            <legend className="text-sm font-semibold text-text">3. Servicio deseado</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {pricing.services.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={serviceId === s.id}
                  onClick={() => setServiceId(s.id)}
                  className={`${chip(serviceId === s.id)} text-left`}
                >
                  <span className="block font-medium">{s.name}</span>
                  <span className="block text-[11px] opacity-75">Desde {formatCOP(s.basePrice)}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="mt-6 space-y-3">
            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-border bg-surface px-4 py-3 text-sm">
              <span>
                <span className="block font-medium text-text">Pelaje largo</span>
                <span className="block text-xs text-text-muted">Más tiempo de secado y cepillado</span>
              </span>
              <input
                type="checkbox"
                checked={longCoat}
                onChange={(e) => setLongCoat(e.target.checked)}
                className="h-4 w-4 accent-[color:var(--color-btn)]"
              />
            </label>
            {knotsRule && (
              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-border bg-surface px-4 py-3 text-sm">
                <span>
                  <span className="block font-medium text-text">Tratamiento de nudos o pelo enredado</span>
                  <span className="block text-xs text-text-muted">
                    Recargo de {formatCOP(knotsRule.amount)}
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={knots}
                  onChange={(e) => setKnots(e.target.checked)}
                  className="h-4 w-4 accent-[color:var(--color-btn)]"
                />
              </label>
            )}
          </div>
        </div>

        <aside className="card flex flex-col rounded-3xl p-6" aria-live="polite">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Resumen de cita</p>
          <div className="mt-3">
            {row('Mascota', `${species === 'canina' ? 'Perro' : 'Gato'} ${tiers.find((t) => t.size === size)?.label.toLowerCase() ?? ''}`)}
            {row('Servicio', service.name)}
            {row('Precio base', formatCOP(service.basePrice))}
            {sizeAmount !== 0 && row('Recargo por tamaño', `+${formatCOP(sizeAmount)}`)}
            {coatAmount !== 0 && row('Recargo por pelaje', `+${formatCOP(coatAmount)}`)}
            {knotsAmount !== 0 && row('Tratamiento de nudos', `+${formatCOP(knotsAmount)}`)}
          </div>
          <div className="mt-5 rounded-2xl bg-surface-2 p-5">
            <p className="text-xs text-text-muted">Precio estimado</p>
            <p className="mt-1 font-display text-4xl font-extrabold text-text">{formatCOP(total)}</p>
            <p className="mt-1 text-[11px] text-text-muted">COP · Pagas al recoger</p>
          </div>
          <button
            type="button"
            onClick={onBook}
            className="focus-ring mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--color-btn)] px-5 py-3 text-sm font-semibold text-[color:var(--color-btn-fg)] hover:bg-[color:var(--color-btn-hover)]"
          >
            Apartar turno con este precio
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <p className="mt-3 text-center text-[11px] leading-relaxed text-text-muted">
            Otras condiciones de piel o de comportamiento se revisan en su ficha y pueden
            ajustar el valor.
          </p>
        </aside>
      </div>
    </section>
  );
}
