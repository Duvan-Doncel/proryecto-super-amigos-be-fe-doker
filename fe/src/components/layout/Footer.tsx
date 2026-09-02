/**
 * Archivo: components/layout/Footer.tsx
 * Descripción: Pie de página de GroomingSpa — enlaces útiles, legales y contacto.
 * ¿Impacto? Centralizar el footer evita duplicar el aviso y los enlaces en cada página.
 */

import { Link } from 'react-router-dom';
import { BUSINESS } from '@/config/legal';

const NAV_LINKS = [
  { to: '/', label: 'Inicio' },
  { to: '/precios', label: 'Cómo calculamos el precio' },
  { to: '/terminos', label: 'Términos y Condiciones' },
  { to: '/privacidad', label: 'Política de Privacidad' },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 mt-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="text-center sm:text-left">
            <p className="font-comic tracking-wide text-sm text-gray-900 dark:text-slate-100">
              🐾 {BUSINESS.nombreComercial}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">{BUSINESS.direccion}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Tel / WhatsApp:{' '}
              <a
                href={`https://wa.me/57${BUSINESS.telefonoDigitos}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {BUSINESS.telefono}
              </a>
              {' · '}
              {BUSINESS.horario}
            </p>
          </div>

          <nav aria-label="Enlaces del pie de página" className="flex flex-col items-center gap-1.5 sm:items-end">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-xs text-gray-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:underline transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <p className="mt-6 border-t border-gray-200 dark:border-slate-800 pt-4 text-center text-xs text-gray-500 dark:text-slate-400">
          © {year} {BUSINESS.nombreComercial} — Proyecto formativo SENA. Tratamos tus datos
          conforme a la Ley 1581 de 2012.
        </p>
      </div>
    </footer>
  );
}
