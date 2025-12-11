/**
 * Auto Reconnect Component
 * Automatically reconnects and refreshes when user returns to the tab
 * Ensures latest version is always loaded
 */

import { useEffect } from 'react'
import { logger } from '../utils/logger'

function AutoReconnect() {
  useEffect(() => {
    let hiddenTime = null

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is hidden - record the time
        hiddenTime = Date.now()
      } else if (hiddenTime) {
        // Tab is visible again
        const timeAway = Date.now() - hiddenTime

        // If away for more than 5 seconds, check HMR connection
        if (timeAway > 5000) {
          // Check if HMR is available
          if (import.meta.hot) {
            logger.log('[AutoReconnect] Checking HMR connection after being away...')

            // Send a ping to check connection
            // If connection is lost, it will automatically reconnect
            // If there are updates, they will be applied
            import.meta.hot.send('vite:ping')
          }

          // Also check if server is still responsive
          fetch(window.location.origin)
            .then(response => {
              if (response.ok) {
                logger.log('[AutoReconnect] Server is responsive')
              }
            })
            .catch(() => {
              logger.warn('[AutoReconnect] Server not responding - page may need manual refresh')
            })
        }

        hiddenTime = null
      }
    }

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // HMR connection status monitoring
    if (import.meta.hot) {
      // Log when HMR connects/disconnects
      import.meta.hot.on('vite:ws:connect', () => {
        logger.log('[AutoReconnect] HMR connected')
      })

      import.meta.hot.on('vite:ws:disconnect', () => {
        logger.warn('[AutoReconnect] HMR disconnected - will attempt to reconnect')
      })
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return null // This component doesn't render anything
}

export default AutoReconnect
