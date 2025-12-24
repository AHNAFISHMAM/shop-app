import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

/**
 * Theme type
 */
export type Theme = 'dark' | 'light'

/**
 * ThemeContextValue interface
 */
export interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  themes: Theme[]
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)
const THEME_KEY = 'star_cafe_theme'
const VALID_THEMES: Theme[] = ['dark', 'light']
const DEFAULT_THEME: Theme = 'dark'

/**
 * ThemeProviderProps interface
 */
export interface ThemeProviderProps {
  children: ReactNode
}

/**
 * ThemeProvider Component
 *
 * @param {ThemeProviderProps} props - Component props
 */
export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME)

  // Load theme from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY)
    let migratedTheme: string | null = stored

    // Migrate old theme names to new naming scheme
    if (stored === 'current-design') migratedTheme = 'dark'
    if (stored === 'ivory-star') migratedTheme = 'light'

    if (migratedTheme && VALID_THEMES.includes(migratedTheme as Theme)) {
      setTheme(migratedTheme as Theme)
      // Update localStorage if migration occurred
      if (migratedTheme !== stored) {
        localStorage.setItem(THEME_KEY, migratedTheme)
      }
    }
  }, [])

  // Apply theme class to document root and persist to localStorage
  useEffect(() => {
    const root = document.documentElement

    // Remove all theme classes
    VALID_THEMES.forEach(t => root.classList.remove(`theme-${t}`))

    // Always add current theme class (including dark)
    root.classList.add(`theme-${theme}`)

    // Persist to localStorage
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: VALID_THEMES }}>
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * useTheme hook
 *
 * @returns {ThemeContextValue} Theme context value
 * @throws {Error} If used outside ThemeProvider
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
