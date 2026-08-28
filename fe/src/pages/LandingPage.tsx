/**
 * Archivo: pages/LandingPage.tsx
 * Descripción: Página pública de bienvenida de GroomingSpa.
 * ¿Para qué? Es la puerta de entrada para alguien que llega sin saber nada del negocio —
 *   debe explicar en un vistazo qué es Super Amigos Grooming Spa, qué servicios ofrece,
 *   por qué elegirlo y cómo contactarlo, sin necesitar iniciar sesión para entenderlo.
 * ¿Impacto? Deja explícito que NO es una clínica veterinaria (RN de restricciones.md) —
 *   evita que alguien llegue esperando atención médica que este negocio no presta.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Scissors,
  Stethoscope,
  AlertTriangle,
  ShoppingBag,
  CheckCircle2,
  MapPin,
  Phone,
  Clock,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

// ¿Qué? Datos reales de contacto y ubicación del negocio.
// ¿Para qué? Centralizados aquí para que sean fáciles de actualizar si cambian.
const ADDRESS = 'Cra 77L # 78-88 Sur, Manzana 1B';
const PHONE_DISPLAY = '321 285 2797';
const PHONE_DIGITS = '3212852797';
const WHATSAPP_LINK = `https://wa.me/57${PHONE_DIGITS}`;

// ¿Qué? Fotos reales de mascotas atendidas en Super Amigos, servidas desde public/galeria.
// ¿Para qué? Para agregar más, solo hay que copiar el archivo ahí y sumar 1 a `length`.
// ¿Impacto? En vez de un único bloque de galería, se reparten en 3 momentos de la página
//   (hero, un divisor a la mitad, y el cierre) para que se sientan por todas partes,
//   y las primeras 6 aparecen ANTES que el título — son lo primero que se ve al entrar.
const GALLERY_PHOTOS = Array.from({ length: 20 }, (_, i) => `/galeria/perro${i + 1}.jpg.jpeg`).map(
  (src, i) => ({ src, i }),
);

const HERO_PHOTOS = GALLERY_PHOTOS.slice(0, 6);
const CLOSING_PHOTOS = GALLERY_PHOTOS.slice(10, 14);

// ¿Qué? Las 6 fotos del hero se muestran de a 3, rotando automáticamente (RN visual).
const HERO_GROUPS = [HERO_PHOTOS.slice(0, 3), HERO_PHOTOS.slice(3, 6)];
const HERO_ROTATION_MS = 5000;

// ¿Qué? El divisor "Nuestros consentidos" son 2 marcos grandes por los que van pasando,
//   uno a la vez, TODAS las fotos de la galería (no un subconjunto fijo) — cuando se
//   agreguen más fotos más adelante, entran solas al ciclo sin tocar este código.
const FRAME_ROTATION_MS = 5000;

// ¿Qué? Rotaciones alternadas para el efecto "fotos tipo polaroid regadas sobre la mesa".
const ROTATIONS = ['-rotate-6', 'rotate-3', '-rotate-2', 'rotate-6', '-rotate-4', 'rotate-2'];
const LIFTS = ['mt-0', 'mt-4', 'mt-1', 'mt-3', 'mt-0', 'mt-4'];

interface PolaroidStripProps {
  photos: { src: string; i: number }[];
  onOpen: (i: number) => void;
  size: 'xl' | 'lg' | 'sm';
  fadeKey?: number;
}

const SIZE_CLASSES: Record<PolaroidStripProps['size'], string> = {
  xl: 'w-32 h-32 sm:w-48 sm:h-48',
  lg: 'w-20 h-20 sm:w-28 sm:h-28',
  sm: 'w-16 h-16 sm:w-20 sm:h-20',
};

// ¿Qué? El grupo grande del hero lleva más separación para que 3 fotos "abarquen"
//   más ancho de pantalla — los grupos chicos (divisor/cierre) se quedan compactos.
const GAP_CLASSES: Record<PolaroidStripProps['size'], string> = {
  xl: 'gap-6 sm:gap-14',
  lg: 'gap-3 sm:gap-4',
  sm: 'gap-3 sm:gap-4',
};

// ¿Qué? Tira de fotos "polaroid" rotadas — reutilizada en el hero, el divisor y el cierre.
// ¿Para qué? Un solo componente evita repetir el marcado del efecto en 3 lugares distintos.
// ¿Impacto? `fadeKey` fuerza a React a remontar el contenedor cuando cambia (usado por el
//   carrusel del hero), lo que reinicia la animación .comic-fade-in en cada grupo nuevo.
function PolaroidStrip({ photos, onOpen, size, fadeKey }: PolaroidStripProps) {
  return (
    <div key={fadeKey} className={`flex flex-wrap justify-center ${GAP_CLASSES[size]} comic-fade-in`}>
      {photos.map(({ src, i }, idx) => (
        <button
          key={src}
          onClick={() => onOpen(i)}
          className={[
            'comic-border rounded-lg overflow-hidden shadow-lg bg-white p-1',
            SIZE_CLASSES[size],
            ROTATIONS[idx % ROTATIONS.length],
            LIFTS[idx % LIFTS.length],
            'hover:z-10 hover:scale-110 hover:rotate-0 transition-transform duration-200',
          ].join(' ')}
        >
          <img
            src={src}
            alt="Mascota atendida en Super Amigos Grooming Spa"
            loading="lazy"
            className="h-full w-full object-cover rounded"
          />
        </button>
      ))}
    </div>
  );
}

interface PhotoFrameProps {
  photo: { src: string; i: number };
  onOpen: (i: number) => void;
}

// ¿Qué? Un marco grande y recto (sin inclinación) con una sola foto que va cambiando.
// ¿Para qué? Usado en pares en el divisor "Nuestros consentidos" — cada marco recorre
//   solo, por su cuenta, toda la galería de fotos.
function PhotoFrame({ photo, onOpen }: PhotoFrameProps) {
  return (
    <button
      key={photo.src}
      onClick={() => onOpen(photo.i)}
      className="comic-border comic-shadow rounded-xl overflow-hidden bg-white p-2 w-full aspect-square comic-fade-in"
    >
      <img
        src={photo.src}
        alt="Mascota atendida en Super Amigos Grooming Spa"
        loading="lazy"
        className="h-full w-full object-cover rounded-lg"
      />
    </button>
  );
}

export function LandingPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [heroGroup, setHeroGroup] = useState(0);
  const [frameCursor, setFrameCursor] = useState(0);

  // ¿Qué? Rota el grupo de fotos del hero cada 5 segundos (RF visual del landing).
  // ¿Para qué? Mostrar más fotos sin agrandar el hero — de a 3, en vez de las 6 fijas.
  useEffect(() => {
    const id = setInterval(() => {
      setHeroGroup((g) => (g + 1) % HERO_GROUPS.length);
    }, HERO_ROTATION_MS);
    return () => clearInterval(id);
  }, []);

  // ¿Qué? Avanza los 2 marcos del divisor — recorren TODA la galería, uno a la vez.
  useEffect(() => {
    const id = setInterval(() => {
      setFrameCursor((c) => (c + 1) % GALLERY_PHOTOS.length);
    }, FRAME_ROTATION_MS);
    return () => clearInterval(id);
  }, []);

  // ¿Qué? Cierra el lightbox con Escape y navega con las flechas del teclado.
  // ¿Para qué? Accesibilidad — no todos navegan una galería solo con el mouse.
  useEffect(() => {
    if (openIndex === null) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpenIndex(null);
      if (e.key === 'ArrowRight') setOpenIndex((i) => (i === null ? i : (i + 1) % GALLERY_PHOTOS.length));
      if (e.key === 'ArrowLeft') {
        setOpenIndex((i) => (i === null ? i : (i - 1 + GALLERY_PHOTOS.length) % GALLERY_PHOTOS.length));
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openIndex]);

  return (
    <div>
      {/* ─── Hero — las fotos van PRIMERO, antes del título, para que sean lo primero que se vea ─── */}
      <section className="max-w-3xl mx-auto px-4 pt-14 pb-20 text-center">
        <div className="mb-8">
          <PolaroidStrip photos={HERO_GROUPS[heroGroup]} onOpen={setOpenIndex} size="xl" fadeKey={heroGroup} />
        </div>

        <h1 className="text-4xl font-comic tracking-wide text-gray-900 dark:text-slate-100 mb-3">
          🐾 Super Amigos Grooming Spa
        </h1>
        <p className="text-gray-700 dark:text-slate-300 mb-8">
          Peluquería y spa para tu mascota. Agenda tu cita, reporta un síntoma o compra
          sus productos favoritos, todo desde un solo lugar.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/register">
            <Button variant="primary">Crear cuenta</Button>
          </Link>
          <Link to="/login">
            <Button variant="secondary">Iniciar sesión</Button>
          </Link>
        </div>
      </section>

      {/* ─── ¿Qué es Super Amigos Grooming Spa? ─── */}
      <section className="bg-gray-50 dark:bg-slate-950 py-14">
        <div className="max-w-3xl mx-auto px-4">
          <div className="comic-border comic-shadow rounded-xl p-6 sm:p-8 bg-white dark:bg-slate-900 text-center">
            <h2 className="text-2xl font-comic tracking-wide text-gray-900 dark:text-slate-100 mb-4">
              ¿Quiénes somos?
            </h2>
            <p className="text-gray-700 dark:text-slate-300 leading-relaxed">
              Somos una micro-empresa dedicada al <strong className="text-gray-900 dark:text-slate-100">grooming</strong> (peluquería
              y spa) para perros, gatos y otras mascotas domésticas, además de vender juguetes,
              accesorios y productos para su cuidado.{' '}
              <strong className="text-gray-900 dark:text-slate-100">No somos una clínica veterinaria</strong> —
              contamos con una auxiliar en veterinaria que revisa síntomas leves y te orienta, pero
              para diagnósticos, tratamientos o emergencias médicas siempre te dirigimos a un
              profesional o centro veterinario.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Los 3 servicios (semáforo) ─── */}
      <section className="max-w-4xl mx-auto px-4 py-14">
        <h2 className="text-2xl font-comic tracking-wide text-gray-900 dark:text-slate-100 mb-2 text-center">
          ¿Cómo te ayudamos?
        </h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 text-center mb-8">
          Al registrarte, un sencillo semáforo te guía según lo que tu mascota necesita.
        </p>
        <div className="grid gap-5 sm:grid-cols-3">
          <div className="comic-border comic-shadow rounded-xl p-5 bg-white dark:bg-slate-900">
            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
              <Scissors className="h-5 w-5 text-green-600 dark:text-green-400" aria-hidden="true" />
            </div>
            <p className="font-semibold text-gray-900 dark:text-slate-100 mb-1">🟢 Cita de Grooming</p>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Tu mascota está sana y quiere verse bonita. Agenda baño, corte y spa en el horario
              que prefieras.
            </p>
          </div>
          <div className="comic-border comic-shadow rounded-xl p-5 bg-white dark:bg-slate-900">
            <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-3">
              <Stethoscope className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            </div>
            <p className="font-semibold text-gray-900 dark:text-slate-100 mb-1">🟡 Síntoma Leve</p>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Tu mascota tiene algo leve (no come bien, está decaída). Cuéntanos y nuestra
              auxiliar en veterinaria te da una recomendación.
            </p>
          </div>
          <div className="comic-border comic-shadow rounded-xl p-5 bg-white dark:bg-slate-900">
            <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-3">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" aria-hidden="true" />
            </div>
            <p className="font-semibold text-gray-900 dark:text-slate-100 mb-1">🔴 Emergencia</p>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Si es urgente, te mostramos veterinarias cercanas y números de emergencia al
              instante — nunca te dejamos sin saber a dónde ir.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Tienda ─── */}
      <section className="py-14">
        <div className="max-w-3xl mx-auto px-4">
          <div className="comic-border comic-shadow rounded-xl p-6 sm:p-8 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <div className="h-16 w-16 shrink-0 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mx-auto sm:mx-0">
              <ShoppingBag className="h-8 w-8 text-brand-600 dark:text-brand-400" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-2xl font-comic tracking-wide text-gray-900 dark:text-slate-100 mb-2">
                🛍️ También tenemos tienda
              </h2>
              <p className="text-gray-700 dark:text-slate-300">
                Juguetes, accesorios y productos para tu mascota. Arma tu pedido desde la app
                y págalo presencialmente al recogerlo en el local.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Divisor de fotos — 2 marcos grandes que recorren TODA la galería ─── */}
      <section className="max-w-2xl mx-auto px-4 py-14">
        <h2 className="text-2xl font-comic tracking-wide text-gray-900 dark:text-slate-100 mb-2 text-center">
          Algunos de nuestros consentidos 🐾
        </h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 text-center mb-8">
          Haz clic en una foto para verla más grande.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10">
          <PhotoFrame
            key={`frame-a-${frameCursor}`}
            photo={GALLERY_PHOTOS[frameCursor]}
            onOpen={setOpenIndex}
          />
          <PhotoFrame
            key={`frame-b-${frameCursor}`}
            photo={GALLERY_PHOTOS[(frameCursor + Math.floor(GALLERY_PHOTOS.length / 2)) % GALLERY_PHOTOS.length]}
            onOpen={setOpenIndex}
          />
        </div>
      </section>

      {/* ─── ¿Por qué elegirnos? ─── */}
      <section className="py-14">
        <div className="max-w-3xl mx-auto px-4">
          <div className="comic-border comic-shadow rounded-xl p-6 sm:p-8 bg-white dark:bg-slate-900">
            <h2 className="text-2xl font-comic tracking-wide text-gray-900 dark:text-slate-100 mb-6 text-center">
              ¿Por qué elegirnos?
            </h2>
            <ul className="space-y-4">
              {[
                'Agenda tu cita en línea, a la hora que te quede mejor — sin llamadas ni filas.',
                'El historial de tu mascota (peso, color, patologías) queda registrado para atenderla mejor cada vez.',
                'Seguimiento de tus pedidos y reportes de síntomas, todo desde tu cuenta.',
                'Atención cercana: si algo se sale de nuestro alcance, te lo decimos y te orientamos a dónde ir.',
              ].map((text) => (
                <li key={text} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="text-gray-700 dark:text-slate-300">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ─── Ubicación y contacto ─── */}
      <section className="bg-gray-50 dark:bg-slate-950 py-14">
        <div className="max-w-3xl mx-auto px-4">
          <div className="comic-border comic-shadow rounded-xl p-6 sm:p-8 bg-white dark:bg-slate-900">
            <h2 className="text-2xl font-comic tracking-wide text-gray-900 dark:text-slate-100 mb-6 text-center">
              Visítanos
            </h2>
            <div className="grid gap-6 sm:grid-cols-3 text-center">
              <div className="flex flex-col items-center gap-2">
                <MapPin className="h-6 w-6 text-brand-600 dark:text-brand-400" aria-hidden="true" />
                <p className="text-sm text-gray-700 dark:text-slate-300">{ADDRESS}</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Phone className="h-6 w-6 text-brand-600 dark:text-brand-400" aria-hidden="true" />
                <a
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-700 dark:text-slate-300 hover:underline"
                >
                  {PHONE_DISPLAY} (WhatsApp)
                </a>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Clock className="h-6 w-6 text-brand-600 dark:text-brand-400" aria-hidden="true" />
                <p className="text-sm text-gray-700 dark:text-slate-300">
                  Todos los días: 9:00am – 6:00pm
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Llamado a la acción final — cierra con más fotos alrededor del CTA ─── */}
      <section className="bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="mb-8">
            <PolaroidStrip photos={CLOSING_PHOTOS} onOpen={setOpenIndex} size="sm" />
          </div>
          <h2 className="text-2xl font-comic tracking-wide text-gray-900 dark:text-slate-100 mb-3">
            ¿Listo para consentir a tu mascota?
          </h2>
          <p className="text-gray-700 dark:text-slate-300 mb-6">
            Crea tu cuenta gratis y agenda su primera cita en minutos.
          </p>
          <Link to="/register">
            <Button variant="primary">Crear cuenta 🐾</Button>
          </Link>
        </div>
      </section>

      {/* ─── Lightbox — comparte estado con las 3 tiras de fotos de arriba ─── */}
      {openIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Foto ampliada de una mascota atendida en Super Amigos Grooming Spa"
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setOpenIndex(null)}
        >
          <button
            onClick={() => setOpenIndex(null)}
            aria-label="Cerrar"
            className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpenIndex((i) => (i === null ? i : (i - 1 + GALLERY_PHOTOS.length) % GALLERY_PHOTOS.length));
            }}
            aria-label="Foto anterior"
            className="absolute left-2 sm:left-6 text-white p-2 hover:bg-white/10 rounded-full"
          >
            <ChevronLeft className="h-7 w-7" aria-hidden="true" />
          </button>

          <img
            src={GALLERY_PHOTOS[openIndex].src}
            alt="Mascota atendida en Super Amigos Grooming Spa"
            className="max-h-[85vh] max-w-full rounded-xl comic-border"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpenIndex((i) => (i === null ? i : (i + 1) % GALLERY_PHOTOS.length));
            }}
            aria-label="Foto siguiente"
            className="absolute right-2 sm:right-6 text-white p-2 hover:bg-white/10 rounded-full"
          >
            <ChevronRight className="h-7 w-7" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
