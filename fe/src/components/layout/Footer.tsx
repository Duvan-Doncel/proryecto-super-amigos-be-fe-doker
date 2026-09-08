/**
 * Archivo: components/layout/Footer.tsx
 * Descripción: Pie de página comercial de Super Amigos Grooming Spa.
 * ¿Para qué? Cierre de confianza: marca, contacto real, horario, enlaces útiles/legales y
 *   redes. Centralizado para no duplicarlo en cada página.
 * ¿Impacto? Usa BUSINESS de config/legal.ts — los datos se editan en un solo sitio.
 */

import { Link } from 'react-router-dom';
import { PawPrint, MapPin, Phone, Clock, Camera, ThumbsUp, MessageCircle } from 'lucide-react';
import { BUSINESS } from '@/config/legal';

const RECURSOS = [
  { to: '/precios', label: 'Cómo calculamos el precio' },
  { to: '/terminos', label: 'Términos y Condiciones' },
  { to: '/privacidad', label: 'Política de Privacidad' },
];

const MAPS_LINK = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(BUSINESS.direccion)}`;
const WHATSAPP_LINK = `https://wa.me/57${BUSINESS.telefonoDigitos}`;

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Marca */}
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg brand-gradient text-white">
                <PawPrint className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="font-display text-sm font-extrabold text-text">
                {BUSINESS.nombreComercial}
              </span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-text-muted">
              Peluquería y spa para tu mascota en {BUSINESS.ciudad}. No somos una clínica
              veterinaria.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="focus-ring rounded-lg border border-border p-2 text-text-muted hover:text-text"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="https://www.instagram.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="focus-ring rounded-lg border border-border p-2 text-text-muted hover:text-text"
              >
                <Camera className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="https://www.facebook.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="focus-ring rounded-lg border border-border p-2 text-text-muted hover:text-text"
              >
                <ThumbsUp className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Contacto */}
          <div>
            <p className="font-display text-sm font-bold text-text">Visítanos</p>
            <ul className="mt-3 space-y-2 text-xs text-text-muted">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <a href={MAPS_LINK} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {BUSINESS.direccion}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {BUSINESS.telefono} · WhatsApp
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {BUSINESS.horario}
              </li>
            </ul>
          </div>

          {/* Recursos */}
          <div>
            <p className="font-display text-sm font-bold text-text">Información</p>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link to="/" className="text-text-muted hover:text-text hover:underline">
                  Inicio
                </Link>
              </li>
              {RECURSOS.map((r) => (
                <li key={r.to}>
                  <Link to={r.to} className="text-text-muted hover:text-text hover:underline">
                    {r.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal / protección de datos */}
          <div>
            <p className="font-display text-sm font-bold text-text">Protección de datos</p>
            <p className="mt-3 text-xs leading-relaxed text-text-muted">
              Tratamos tus datos conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013.
              Peticiones de habeas data:{' '}
              <a href={`mailto:${BUSINESS.correoDatos}`} className="hover:underline">
                {BUSINESS.correoDatos}
              </a>
            </p>
          </div>
        </div>

        <p className="mt-10 border-t border-border pt-6 text-center text-xs text-text-muted">
          © {year} {BUSINESS.nombreComercial}. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
