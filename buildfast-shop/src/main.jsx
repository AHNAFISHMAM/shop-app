// import { StrictMode } from 'react' // Temporarily disabled for HMR testing
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './contexts/ThemeContext'

// Import contrast verification (runs in development mode)
import './utils/verifyThemeContrast'

// NOTE: StrictMode temporarily disabled to fix Hot Module Replacement (HMR)
// StrictMode causes double-mounting in dev which interferes with hot reload
// Re-enable before production build!
createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </HelmetProvider>
  </QueryClientProvider>,
)
