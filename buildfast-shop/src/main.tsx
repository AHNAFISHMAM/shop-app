import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import './index.css'
import App from './App'
import { ThemeProvider } from './contexts/ThemeContext'

// CRITICAL: Expose React globally for framer-motion compatibility
// This prevents "Cannot read properties of undefined (reading 'createContext')" errors
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).React = React
}

// Import contrast verification (runs in development mode)
import './utils/verifyThemeContrast'

// Initialize Web Vitals performance monitoring
import { initWebVitals } from './utils/web-vitals'
initWebVitals()

// Debug: Log app initialization
if (typeof window !== 'undefined') {
  console.log('🚀 App: Starting initialization...')
  console.log('🚀 Environment:', import.meta.env.MODE)
  console.log('🚀 Supabase URL:', import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing')
  console.log('🚀 Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing')
}

const rootElement = document.getElementById('root')
if (!rootElement) {
  console.error('❌ CRITICAL: Root element not found! Check index.html')
  throw new Error('Root element not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </HelmetProvider>
    </QueryClientProvider>
  </StrictMode>
)
