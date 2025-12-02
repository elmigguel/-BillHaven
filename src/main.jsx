// CRITICAL: Polyfills must be loaded FIRST before any other imports
// This fixes "Buffer is not defined" error for blockchain libraries (TON, Solana, etc.)
console.log('🚀 BillHaven starting...')
import { Buffer } from 'buffer';
window.Buffer = Buffer;

// Also polyfill process for some libraries
if (typeof window !== 'undefined') {
  window.process = window.process || { env: {} };
}
console.log('✅ Polyfills loaded')

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

console.log('✅ All imports loaded')

const queryClient = new QueryClient();
console.log('✅ QueryClient created')

console.log('✅ Starting React render...')

// CRITICAL FIX: Show loading state immediately to prevent empty root
const rootElement = document.getElementById('root')
if (!rootElement) {
  console.error('❌ FATAL: Root element not found!')
  document.body.innerHTML = '<div style="color: red; padding: 20px; font-family: monospace;">FATAL ERROR: Root element #root not found in DOM</div>'
  throw new Error('Root element not found')
}

// Show immediate loading state
rootElement.innerHTML = '<div style="min-height: 100vh; background: #111827; display: flex; align-items: center; justify-content: center;"><div style="color: white; font-family: system-ui; font-size: 18px;">Loading BillHaven...</div></div>'

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)
console.log('✅ React render initiated')
