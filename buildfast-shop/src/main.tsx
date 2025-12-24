import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import './index.css'
import App from './App'
import { ThemeProvider } from './contexts/ThemeContext'

// Import contrast verification (runs in development mode)
import './utils/verifyThemeContrast'

// Initialize Web Vitals performance monitoring
import { initWebVitals } from './utils/web-vitals'
initWebVitals()

createRoot(document.getElementById('root')!).render(
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
