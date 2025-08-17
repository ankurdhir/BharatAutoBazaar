import React, { createContext, useContext, useState } from 'react'

const GlobalLoaderContext = createContext()

export const useGlobalLoader = () => {
  const context = useContext(GlobalLoaderContext)
  if (!context) {
    throw new Error('useGlobalLoader must be used within a GlobalLoaderProvider')
  }
  return context
}

export const GlobalLoaderProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingText, setLoadingText] = useState('Loading...')
  const [loadingCount, setLoadingCount] = useState(0)

  const showLoader = (text = 'Loading...') => {
    setLoadingText(text)
    setLoadingCount(prev => prev + 1)
    setIsLoading(true)
  }

  const hideLoader = () => {
    setLoadingCount(prev => {
      const newCount = Math.max(0, prev - 1)
      if (newCount === 0) {
        setIsLoading(false)
      }
      return newCount
    })
  }

  const forceHideLoader = () => {
    setLoadingCount(0)
    setIsLoading(false)
  }

  const value = {
    isLoading,
    loadingText,
    showLoader,
    hideLoader,
    forceHideLoader
  }

  return (
    <GlobalLoaderContext.Provider value={value}>
      {children}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex flex-col items-center space-y-4 min-w-[200px]">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-700 dark:text-gray-300 font-medium">{loadingText}</p>
          </div>
        </div>
      )}
    </GlobalLoaderContext.Provider>
  )
}

export default GlobalLoaderContext 