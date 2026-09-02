/**
 * Archivo: pages/legal/LegalLayout.tsx
 * Descripción: Envoltura visual común para las páginas legales (Términos, Privacidad).
 * ¿Para qué? Que ambos documentos compartan el mismo encabezado, ancho de lectura y
 *   estilo de secciones sin repetir el marcado.
 */

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LEGAL_VERSION, LEGAL_UPDATED_AT } from '@/config/legal';

interface LegalLayoutProps {
  title: string;
  intro: ReactNode;
  children: ReactNode;
}

export function LegalLayout({ title, intro, children }: LegalLayoutProps) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link to="/" className="text-sm text-gray-500 dark:text-slate-400 hover:underline">
        ← Volver al inicio
      </Link>

      <h1 className="text-2xl font-comic tracking-wide text-gray-900 dark:text-slate-100 mt-4 mb-2">
        {title}
      </h1>
      <p className="text-xs text-gray-500 dark:text-slate-400 mb-6">
        Versión {LEGAL_VERSION} — última actualización: {LEGAL_UPDATED_AT}
      </p>

      <div className="text-sm text-gray-600 dark:text-slate-400 mb-8 leading-relaxed">{intro}</div>

      <div className="space-y-8">{children}</div>

      <p className="mt-10 border-t border-gray-200 dark:border-slate-800 pt-4 text-xs text-gray-500 dark:text-slate-400">
        Este documento es un modelo inicial adaptado a la normativa colombiana. El negocio
        debe revisarlo con un profesional del derecho y completar los datos pendientes antes
        de considerarlo definitivo.
      </p>
    </div>
  );
}

// ¿Qué? Sección numerada de un documento legal — título + contenido.
export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2">{heading}</h2>
      <div className="space-y-3 text-sm text-gray-700 dark:text-slate-300 leading-relaxed">
        {children}
      </div>
    </section>
  );
}
