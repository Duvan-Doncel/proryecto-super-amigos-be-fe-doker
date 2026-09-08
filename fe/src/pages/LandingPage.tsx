/**
 * Archivo: pages/LandingPage.tsx
 * Descripción: Página pública de bienvenida — enfoque comercial.
 * ¿Para qué? Explicar en un vistazo qué es Super Amigos Grooming Spa, qué servicios ofrece,
 *   por qué elegirlo y cómo empezar, con llamados a la acción claros. Deja explícito que
 *   NO es una clínica veterinaria (regla de negocio).
 */

import { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { useAuthModal } from '@/hooks/useAuthModal';
import { Button } from '@/components/ui/Button';
import { TRUST_STATS } from '@/config/landing';
import { TESTIMONIALS } from '@/data/testimonials';
import * as servicesApi from '@/api/services';
import type { Service } from '@/types/services';
import { formatCOP } from '@/types/pricing';

const GALLERY = Array.from({ length: 12 }, (_, i) => `/galeria/perro${i + 1}.jpg.jpeg`);

// ¿Qué? Servicios "de vitrina" — el precio real se completa desde la API si hay match por
//   nombre; si no, se muestra la descripción sin precio.
const SERVICE_CARDS = [
  { icon: Bath, name: 'Baño & Spa', match: /ba(ñ|n)o|spa/i, desc: 'Baño con productos según su piel, secado, cepillado y perfume.' },
  { icon: Scissors, name: 'Peluquería / Corte', match: /corte|peluquer|estilo/i, desc: 'Corte de raza o a tu gusto, arreglo de cara, patas y sanitario.' },
  { icon: Stethoscope, name: 'Revisión de síntomas leves', match: null, desc: 'Nuestra auxiliar en veterinaria revisa síntomas leves y te orienta.' },
  { icon: ShoppingBag, name: 'Tienda para mascotas', match: null, desc: 'Juguetes, accesorios y productos de cuidado, listos para recoger.' },
];

const STEPS = [
  { icon: PawPrint, title: 'Crea tu cuenta', text: 'Regístrate gratis y acércate para que registremos a tu mascota y su ficha.' },
  { icon: CalendarCheck, title: 'Agenda en línea', text: 'Elige servicio y horario. Ves el precio estimado antes de confirmar.' },
  { icon: ShieldCheck, title: 'Recoge feliz', text: 'Te avisamos cuando esté lista. Pagas al recoger, en el local.' },
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

  return (
    <div className="bg-bg">
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-[color:var(--color-primary)]">
              <PawPrint className="h-3.5 w-3.5" aria-hidden="true" />
              Peluquería y spa para mascotas · Bogotá
            </span>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight text-text sm:text-5xl">
              Tu mascota, consentida y{' '}
              <span className="text-[color:var(--color-primary)]">como nueva</span>.
            </h1>
            <p className="mt-4 max-w-xl text-base text-text-muted">
              Agenda su baño, spa o corte en línea, sigue su ficha de cuidado y compra sus
              productos favoritos — todo desde un solo lugar. Atención cercana, con cita previa.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button onClick={() => openAuthModal('register')}>
                Crear cuenta gratis
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
              <a
                href="#servicios"
                className="focus-ring rounded-lg border border-border px-4 py-2 text-sm font-medium text-text hover:bg-surface-2"
              >
                Ver servicios
              </a>
            </div>
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
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {GALLERY.slice(0, 4).map((src, i) => (
              <button
                key={src}
                onClick={() => setLightbox(i)}
                className={`focus-ring overflow-hidden rounded-2xl border border-border ${
                  i % 3 === 0 ? 'row-span-2 aspect-[3/4]' : 'aspect-square'
                }`}
              >
                <img
                  src={src}
                  alt="Mascota atendida en Super Amigos Grooming Spa"
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Confianza ─── */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-4">
          {TRUST_STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-display text-3xl font-extrabold text-[color:var(--color-primary)]">
                {s.value}
              </p>
              <p className="mt-1 text-xs text-text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Servicios ─── */}
      <section id="servicios" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-extrabold text-text">Nuestros servicios</h2>
          <p className="mt-2 text-sm text-text-muted">
            Todo lo que tu mascota necesita para verse y sentirse bien.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICE_CARDS.map(({ icon: Icon, name, desc, match }) => {
            const price = priceFor(match);
            return (
              <div key={name} className="card flex flex-col p-6">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-[color:var(--color-primary)]/10 text-[color:var(--color-primary)]">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className="mt-4 font-display font-bold text-text">{name}</p>
                <p className="mt-1 flex-1 text-sm text-text-muted">{desc}</p>
                {price != null && (
                  <p className="mt-3 text-sm font-semibold text-text">
                    Desde {formatCOP(price)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── Cómo funciona ─── */}
      <section className="bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-center font-display text-3xl font-extrabold text-text">
            Empezar toma minutos
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <div key={title} className="relative text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl brand-gradient text-white">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <p className="mt-4 font-display font-bold text-text">
                  {i + 1}. {title}
                </p>
                <p className="mt-1 text-sm text-text-muted">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Galería ─── */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center font-display text-3xl font-extrabold text-text">
          Algunos de nuestros consentidos
        </h2>
        <p className="mt-2 text-center text-sm text-text-muted">Toca una foto para verla más grande.</p>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {GALLERY.map((src, i) => (
            <button
              key={src}
              onClick={() => setLightbox(i)}
              className="focus-ring aspect-square overflow-hidden rounded-xl border border-border"
            >
              <img
                src={src}
                alt="Mascota atendida en Super Amigos Grooming Spa"
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
              />
            </button>
          ))}
        </div>
      </section>

      {/* ─── Testimonios ─── */}
      <section className="bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-center font-display text-3xl font-extrabold text-text">
            Lo que dicen nuestros clientes
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="card flex flex-col p-6">
                <Stars rating={t.rating} />
                <blockquote className="mt-3 flex-1 text-sm text-text">“{t.quote}”</blockquote>
                <figcaption className="mt-4 text-xs text-text-muted">
                  <span className="font-semibold text-text">{t.name}</span> · {t.pet}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Disclaimer + CTA ─── */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-[color:var(--color-warning)]/30 bg-[color:var(--color-warning-soft)] p-5 text-sm text-text">
          <strong className="font-semibold">No somos una clínica veterinaria.</strong> Contamos
          con una auxiliar en veterinaria que revisa síntomas leves y te orienta, pero para
          diagnósticos, tratamientos o emergencias médicas siempre te dirigimos a un profesional
          o centro veterinario.
        </div>

        <div className="mt-10 overflow-hidden rounded-2xl brand-gradient px-6 py-12 text-center text-white">
          <h2 className="font-display text-3xl font-extrabold">¿Listo para consentir a tu mascota?</h2>
          <p className="mx-auto mt-2 max-w-lg text-white/90">
            Crea tu cuenta gratis y agenda su primera cita en minutos.
          </p>
          <button
            type="button"
            onClick={() => openAuthModal('register')}
            className="focus-ring mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-[color:var(--color-primary)] hover:bg-white/90"
          >
            Crear cuenta
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </section>

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
            className="max-h-[85vh] max-w-full rounded-xl"
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
