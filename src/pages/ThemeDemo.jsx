import React from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '../contexts/ThemeContext'
import { useBrand } from '../contexts/BrandContext'
import ThemeToggle, { CompactThemeToggle, LabeledThemeToggle, LargeThemeToggle, ThemeSelector } from '../components/ThemeToggle'

export default function ThemeDemo() {
  const { theme, isDark } = useTheme()
  const brand = useBrand()

  const cards = [
    {
      title: "Default Theme Toggle",
      description: "Standard size with smooth animations",
      component: <ThemeToggle />
    },
    {
      title: "Compact Toggle",
      description: "Smaller size for mobile interfaces",
      component: <CompactThemeToggle />
    },
    {
      title: "Labeled Toggle",
      description: "With light/dark labels for clarity",
      component: <LabeledThemeToggle />
    },
    {
      title: "Large Toggle",
      description: "Prominent size for main settings",
      component: <LargeThemeToggle />
    },
    {
      title: "Theme Selector",
      description: "Dropdown with system option",
      component: <ThemeSelector />
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Theme System Demo
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Persistent dark/light mode with animated toggles
          </p>
          
          {/* Current Theme Status */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-6 inline-flex items-center px-4 py-2 rounded-full"
            style={{ backgroundColor: isDark ? brand.primaryColor + '20' : brand.secondaryColor + '20' }}
          >
            <span className="text-2xl mr-2">{isDark ? '🌙' : '☀️'}</span>
            <span className="font-medium text-gray-800 dark:text-gray-200">
              Current theme: <span className="capitalize">{theme}</span>
            </span>
          </motion.div>
        </motion.div>

        {/* Theme Toggle Variations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {cards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {card.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                {card.description}
              </p>
              <div className="flex justify-center">
                {card.component}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Features List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-200 dark:border-gray-700"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Theme System Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-sm"
                       style={{ backgroundColor: brand.primaryColor }}>
                    ✓
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Persistent Storage</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Theme preference saved to localStorage
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-sm"
                       style={{ backgroundColor: brand.primaryColor }}>
                    ✓
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">System Detection</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Respects OS dark/light mode preference
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-sm"
                       style={{ backgroundColor: brand.primaryColor }}>
                    ✓
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Smooth Transitions</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Animated theme changes with Framer Motion
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-sm"
                       style={{ backgroundColor: brand.primaryColor }}>
                    ✓
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Global Application</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Tailwind dark classes applied automatically
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-sm"
                       style={{ backgroundColor: brand.primaryColor }}>
                    ✓
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Multiple Variants</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Different sizes and styles for various UI contexts
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-sm"
                       style={{ backgroundColor: brand.primaryColor }}>
                    ✓
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Flash Prevention</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    No theme flash on page load
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Sample Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
              <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Sample Card {i}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                This content demonstrates how the theme affects all UI elements across the application.
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
} 