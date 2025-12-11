import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5177,
    strictPort: false, // Try another port if 5177 is taken
    watch: {
      usePolling: true, // Enable polling for better file watching on Windows
      interval: 100, // Check for changes every 100ms
    },
    hmr: {
      overlay: true, // Show errors as overlay
      timeout: 30000, // HMR connection timeout (30s)
      protocol: 'ws', // Use WebSocket protocol
      clientPort: undefined, // Use same port as server
    },
    // Keep server alive
    cors: true,
    host: true, // Listen on all addresses
  },
  // Clear cache on server start for fresh updates
  optimizeDeps: {
    force: true, // Force re-optimization
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks - core React libraries
          if (id.includes('node_modules')) {
            // React core
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            // UI libraries
            if (id.includes('framer-motion') || id.includes('react-hot-toast') || id.includes('react-helmet')) {
              return 'vendor-ui';
            }
            // Data/API libraries
            if (id.includes('@supabase') || id.includes('@tanstack/react-query')) {
              return 'vendor-data';
            }
            // Payment libraries
            if (id.includes('@stripe') || id.includes('stripe')) {
              return 'vendor-payment';
            }
            // Date utilities
            if (id.includes('date-fns')) {
              return 'vendor-utils';
            }
            // Other node_modules
            return 'vendor-other';
          }
          // Admin pages chunk
          if (id.includes('/pages/admin/') || id.includes('/pages/Admin') || id.includes('/pages/Kitchen')) {
            return 'admin';
          }
          // Admin components chunk
          if (id.includes('/components/Admin') || id.includes('/components/admin/')) {
            return 'admin-components';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})
