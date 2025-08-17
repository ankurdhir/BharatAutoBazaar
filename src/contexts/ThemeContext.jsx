import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light')
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize theme on mount
  useEffect(() => {
    const initializeTheme = () => {
      try {
        // Check localStorage first
        const stored = localStorage.getItem('bharatautobazaar-theme')
        if (stored && (stored === 'light' || stored === 'dark')) {
          setTheme(stored)
        } else {
          // Check system preference if no stored theme
          const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          const systemTheme = systemPrefersDark ? 'dark' : 'light'
          setTheme(systemTheme)
          localStorage.setItem('bharatautobazaar-theme', systemTheme)
        }
      } catch (error) {
        // Fallback if localStorage is not available
        console.warn('localStorage not available, using light theme')
        setTheme('light')
      } finally {
        setIsInitialized(true)
      }
    }

    initializeTheme()
  }, [])

  // Apply theme to document and persist to localStorage
  useEffect(() => {
    if (!isInitialized) return

    const applyTheme = (newTheme) => {
      const root = document.documentElement
      
      if (newTheme === 'dark') {
        root.classList.add('dark')
        root.classList.remove('light')
      } else {
        root.classList.add('light')
        root.classList.remove('dark')
      }

      // Update meta theme-color for mobile browsers
      const metaThemeColor = document.querySelector('meta[name="theme-color"]')
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', newTheme === 'dark' ? '#111827' : '#ffffff')
      }

      // Persist to localStorage
      try {
        localStorage.setItem('bharatautobazaar-theme', newTheme)
      } catch (error) {
        console.warn('Failed to save theme to localStorage:', error)
      }
    }

    applyTheme(theme)
  }, [theme, isInitialized])

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleSystemThemeChange = (e) => {
      // Only auto-switch if user hasn't manually set a preference
      const stored = localStorage.getItem('bharatautobazaar-theme-manual')
      if (!stored) {
        const systemTheme = e.matches ? 'dark' : 'light'
        setTheme(systemTheme)
      }
    }

    mediaQuery.addEventListener('change', handleSystemThemeChange)
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange)
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    
    // Mark as manually set to prevent auto-switching
    try {
      localStorage.setItem('bharatautobazaar-theme-manual', 'true')
    } catch (error) {
      console.warn('Failed to save manual theme preference:', error)
    }
  }

  const setThemeMode = (mode) => {
    if (mode === 'light' || mode === 'dark') {
      setTheme(mode)
      try {
        localStorage.setItem('bharatautobazaar-theme-manual', 'true')
      } catch (error) {
        console.warn('Failed to save manual theme preference:', error)
      }
    }
  }

  const resetToSystem = () => {
    try {
      localStorage.removeItem('bharatautobazaar-theme-manual')
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const systemTheme = systemPrefersDark ? 'dark' : 'light'
      setTheme(systemTheme)
    } catch (error) {
      console.warn('Failed to reset to system theme:', error)
    }
  }

  const value = {
    theme,
    toggleTheme,
    setThemeMode,
    resetToSystem,
    isInitialized,
    isDark: theme === 'dark',
    isLight: theme === 'light'
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
} 