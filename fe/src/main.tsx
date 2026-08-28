/**
 * Archivo: main.tsx
 * Descripción: Punto de entrada de la aplicación React.
 * ¿Para qué? Montar el componente raíz App en el div#root del index.html.
 * ¿Impacto? Sin StrictMode React no detectaría problemas de efectos dobles en desarrollo.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('No se encontró el elemento #root en el HTML. Verificar index.html.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
