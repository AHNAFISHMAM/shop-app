/**
 * useMediaQuery Hook
 * 
 * Tracks media query matches.
 * Useful for responsive design and conditional rendering.
 * 
 * @param {string} query - Media query string
 * @returns {boolean} Whether the media query matches
 * 
 * @example
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const isDark = useMediaQuery('(prefers-color-scheme: dark)');
 */

import { useState, useEffect } from 'react';

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    
    // Update state with current match value
    const updateMatches = () => {
      setMatches(mediaQuery.matches);
    };

    // Set initial value
    updateMatches();

    // Listen for changes
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateMatches);
      return () => mediaQuery.removeEventListener('change', updateMatches);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(updateMatches);
      return () => mediaQuery.removeListener(updateMatches);
    }
  }, [query]);

  return matches;
}

