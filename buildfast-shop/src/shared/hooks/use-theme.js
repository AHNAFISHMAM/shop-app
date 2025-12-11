/**
 * useTheme Hook
 * 
 * Custom hook for detecting and tracking theme changes.
 * Monitors document.documentElement.classList for theme changes.
 * 
 * @returns {boolean} Whether the current theme is light
 * 
 * @example
 * const isLightTheme = useTheme();
 */

import { useState, useEffect } from 'react';

/**
 * useTheme Hook
 * 
 * Detects and tracks theme changes from document element.
 * 
 * @returns {boolean} Whether the current theme is light
 */
export function useTheme() {
  const [isLightTheme, setIsLightTheme] = useState(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('theme-light');
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const checkTheme = () => {
      setIsLightTheme(document.documentElement.classList.contains('theme-light'));
    };

    // Check theme on mount
    checkTheme();

    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  return isLightTheme;
}

