/**
 * @file Application entry point.
 *
 * Mounts the React app into the DOM. StrictMode is enabled for development
 * warnings (double-renders, deprecated API usage, etc.).
 * Global styles (Tailwind base + custom tokens) are imported via index.css.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
