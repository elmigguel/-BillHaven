import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as Sentry from '@sentry/react'

// Initialize Sentry for error monitoring (production only)
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || '',
  environment: import.meta.env.MODE,
  enabled: import.meta.env.PROD, // Only in production
  tracesSampleRate: 0.1, // 10% of transactions for performance monitoring
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: true, // Privacy: mask all text
      blockAllMedia: true, // Privacy: block all media
    }),
  ],
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of error sessions
  beforeSend(event, hint) {
    // Filter sensitive data from errors
    if (event.request?.headers) {
      delete event.request.headers.Authorization;
      delete event.request.headers['X-API-Key'];
    }
    return event;
  },
});

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)
