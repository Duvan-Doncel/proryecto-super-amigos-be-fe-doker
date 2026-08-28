/**
 * Archivo: components/layout/Footer.tsx
 * Descripción: Pie de página simple de GroomingSpa.
 * ¿Impacto? Centralizar el footer evita duplicar el aviso en cada página.
 */

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 mt-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 text-center">
        <p className="text-xs text-gray-500 dark:text-slate-400">
          © {year} Super Amigos Grooming Spa — Proyecto formativo SENA
        </p>
      </div>
    </footer>
  );
}
