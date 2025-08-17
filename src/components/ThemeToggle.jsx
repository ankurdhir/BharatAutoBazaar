import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../contexts/ThemeContext'
import { useBrand } from '../contexts/BrandContext'

export default function ThemeToggle({ size = 'md', showLabels = false, className = '' }) {
  const { theme, toggleTheme, isDark } = useTheme()
  const brand = useBrand()

  const sizes = {
    sm: {
      container: 'w-12 h-6',
      toggle: 'w-5 h-5',
      translate: 'translate-x-6',
      icon: 'text-xs',
      label: 'text-xs'
    },
    md: {
      container: 'w-14 h-7',
      toggle: 'w-6 h-6',
      translate: 'translate-x-7',
      icon: 'text-sm',
      label: 'text-sm'
    },
    lg: {
      container: 'w-16 h-8',
      toggle: 'w-7 h-7',
      translate: 'translate-x-8',
      icon: 'text-base',
      label: 'text-base'
    }
  }

  const currentSize = sizes[size]

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {showLabels && (
        <span className={`${currentSize.label} font-medium text-gray-600 dark:text-gray-400 transition-colors duration-200`}>
          Light
        </span>
      )}

      {/* Toggle Switch */}
      <motion.button
        onClick={toggleTheme}
        className={`
          ${currentSize.container} relative rounded-full p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900
        `}
        style={{ 
          backgroundColor: isDark ? brand.primaryColor : '#e5e7eb',
          focusRingColor: brand.primaryColor
        }}
        whileTap={{ scale: 0.95 }}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      >
        {/* Background Track */}
        <div className="absolute inset-0 rounded-full opacity-20 bg-gradient-to-r from-transparent via-white to-transparent" />

        {/* Toggle Knob */}
        <motion.div
          className={`
            ${currentSize.toggle} bg-white rounded-full shadow-lg flex items-center justify-center relative overflow-hidden
          `}
          animate={{
            x: isDark ? currentSize.translate.replace('translate-x-', '') : 0
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30
          }}
        >
          {/* Icon Container */}
          <div className="relative w-full h-full flex items-center justify-center">
            <AnimatePresence mode="wait">
              {isDark ? (
                <motion.div
                  key="moon"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`${currentSize.icon} text-indigo-600`}
                >
                  🌙
                </motion.div>
              ) : (
                <motion.div
                  key="sun"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`${currentSize.icon} text-yellow-500`}
                >
                  ☀️
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Subtle glow effect */}
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              boxShadow: isDark 
                ? '0 0 8px rgba(99, 102, 241, 0.3)' 
                : '0 0 8px rgba(251, 191, 36, 0.3)'
            }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>

        {/* Floating particles effect */}
        <AnimatePresence>
          {isDark && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none"
            >
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full"
                  style={{
                    left: `${20 + i * 20}%`,
                    top: `${30 + i * 10}%`
                  }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.3
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {showLabels && (
        <span className={`${currentSize.label} font-medium text-gray-600 dark:text-gray-400 transition-colors duration-200`}>
          Dark
        </span>
      )}
    </div>
  )
}

// Compact version for mobile/minimal UI
export function CompactThemeToggle({ className = '' }) {
  return <ThemeToggle size="sm" className={className} />
}

// Labeled version for settings pages
export function LabeledThemeToggle({ className = '' }) {
  return <ThemeToggle size="md" showLabels={true} className={className} />
}

// Large version for prominent placement
export function LargeThemeToggle({ className = '' }) {
  return <ThemeToggle size="lg" className={className} />
}

// Dropdown theme selector
export function ThemeSelector({ className = '' }) {
  const { theme, setThemeMode, resetToSystem } = useTheme()
  const [isOpen, setIsOpen] = React.useState(false)

  const options = [
    { value: 'light', label: 'Light', icon: '☀️' },
    { value: 'dark', label: 'Dark', icon: '🌙' },
    { value: 'system', label: 'System', icon: '⚙️' }
  ]

  const handleSelect = (value) => {
    if (value === 'system') {
      resetToSystem()
    } else {
      setThemeMode(value)
    }
    setIsOpen(false)
  }

  return (
    <div className={`relative ${className}`}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
        whileTap={{ scale: 0.95 }}
      >
        <span className="text-sm">
          {theme === 'dark' ? '🌙' : '☀️'}
        </span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
          {theme}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-gray-500"
        >
          ▼
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50"
          >
            {options.map((option) => (
              <motion.button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg transition-colors duration-200"
                whileHover={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
                whileTap={{ scale: 0.98 }}
              >
                <span>{option.icon}</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {option.label}
                </span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 