import { createContext, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

const ThemeContext = createContext();
const THEME_KEY = 'star_cafe_theme';
const VALID_THEMES = ['dark', 'light'];
const DEFAULT_THEME = 'dark';

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(DEFAULT_THEME);

  // Load theme from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY);
    let migratedTheme = stored;

    // Migrate old theme names to new naming scheme
    if (stored === 'current-design') migratedTheme = 'dark';
    if (stored === 'ivory-star') migratedTheme = 'light';

    if (migratedTheme && VALID_THEMES.includes(migratedTheme)) {
      setTheme(migratedTheme);
      // Update localStorage if migration occurred
      if (migratedTheme !== stored) {
        localStorage.setItem(THEME_KEY, migratedTheme);
      }
    }
  }, []);

  // Apply theme class to document root and persist to localStorage
  useEffect(() => {
    const root = document.documentElement;

    // Remove all theme classes
    VALID_THEMES.forEach(t => root.classList.remove(`theme-${t}`));

    // Always add current theme class (including dark)
    root.classList.add(`theme-${theme}`);

    // Persist to localStorage
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: VALID_THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
