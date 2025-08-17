import React from 'react'
import { motion } from 'framer-motion'
import { useBrand } from '../contexts/BrandContext'

export default function LoaderCarAnimation({ 
  size = 'md', 
  message = 'Loading...', 
  showMessage = true 
}) {
  const brand = useBrand()

  const sizeClasses = {
    sm: 'w-32 h-16',
    md: 'w-48 h-24', 
    lg: 'w-64 h-32'
  }

  const messageClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center space-y-4"
    >
      {/* CSS Car Animation */}
      <div className={`${sizeClasses[size]} relative overflow-hidden`}>
        {/* Road */}
        <div className="absolute bottom-0 w-full h-1 bg-gray-300 dark:bg-gray-600">
          <motion.div
            animate={{ x: ['-100%', '100%'] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear'
            }}
            className="h-full w-4 bg-yellow-400 opacity-60"
          />
        </div>

        {/* Car Body */}
        <motion.div
          animate={{ x: ['-25%', '125%'] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear'
          }}
          className="absolute bottom-1"
        >
          {/* Car Main Body */}
          <div 
            className="w-16 h-6 rounded-lg relative shadow-lg"
            style={{ backgroundColor: brand.primaryColor }}
          >
            {/* Car Windows */}
            <div className="absolute top-1 left-2 w-12 h-3 bg-blue-200 dark:bg-blue-300 rounded opacity-80"></div>
            
            {/* Car Wheels */}
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                ease: 'linear'
              }}
              className="absolute -bottom-1 left-1 w-3 h-3 bg-gray-800 rounded-full"
            />
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                ease: 'linear'
              }}
              className="absolute -bottom-1 right-1 w-3 h-3 bg-gray-800 rounded-full"
            />

            {/* Car Headlight */}
            <div className="absolute top-2 right-0 w-1 h-2 bg-yellow-300 rounded-sm"></div>
          </div>
        </motion.div>

        {/* Smoke/Exhaust Effect */}
        <motion.div
          animate={{ 
            opacity: [0, 0.6, 0],
            scale: [0.5, 1.2, 1.5],
            x: ['0%', '20%', '40%']
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeOut'
          }}
          className="absolute bottom-2 left-4 w-2 h-2 bg-gray-400 rounded-full"
        />
      </div>

      {/* Loading Message */}
      {showMessage && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`${messageClasses[size]} font-medium text-gray-600 dark:text-gray-400 text-center`}
        >
          {message}
        </motion.div>
      )}

      {/* Pulsing Dots */}
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2
            }}
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: brand.primaryColor }}
          />
        ))}
      </div>
    </motion.div>
  )
}

// Full-screen overlay loader
export function FullScreenLoader({ message }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"
    >
      <LoaderCarAnimation size="lg" message={message} />
    </motion.div>
  )
}

// Inline content loader
export function InlineLoader({ message }) {
  return (
    <div className="flex items-center justify-center py-12">
      <LoaderCarAnimation size="md" message={message} />
    </div>
  )
}

// Compact loader for buttons/cards
export function CompactLoader({ message }) {
  return (
    <div className="flex items-center justify-center py-4">
      <LoaderCarAnimation size="sm" message={message} showMessage={!!message} />
    </div>
  )
} 