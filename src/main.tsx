import * as Sentry from '@sentry/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
import './styles.css';

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_SENTRY_RELEASE,
    sendDefaultPii: false,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.1,
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary
      fallback={
        <main className="fatal-error">
          <h1>Ruffl admin could not start</h1>
          <p>The error has been reported. Refresh once, then contact the operator if it continues.</p>
        </main>
      }>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
);
