import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { BrandProvider } from './contexts/BrandContext'
import { GlobalLoaderProvider } from './contexts/GlobalLoaderContext'
import { useTheme } from './contexts/ThemeContext'
import { Toaster } from './components/ui/toaster'
import ErrorBoundary from './components/ErrorBoundary'

// Fix localStorage issues in development
if (import.meta.env.DEV) {
  import('./utils/cleanupLocalStorage.js')
}

// Components
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import AdminLogin from './components/AdminLogin'
import AdminDashboard from './components/AdminDashboard'

// Pages
import Home from './pages/Home'
import Buy from './pages/Buy'
import Sell from './pages/Sell'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import SellerDashboard from './components/SellerDashboard'
import ListingDetails from './pages/ListingDetails'
import ThemeDemo from './pages/ThemeDemo'

// Loading Screen Component
const LoadingScreen = () => (
  <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Loading Bharat Auto Bazaar...</p>
    </div>
  </div>
)

// App Content Component (wrapped with theme context)
function AppContent() {
  const { isInitialized } = useTheme()

  // Show loading screen until theme is initialized
  if (!isInitialized) {
    return <LoadingScreen />
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="flex flex-col min-h-screen">
        <Navbar />
        
        <main className="flex-1">
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/buy" element={<Buy />} />
              <Route path="/sell" element={<Sell />} />
              <Route path="/seller/dashboard" element={<SellerDashboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/listing/:id" element={<ListingDetails />} />
              <Route path="/test" element={<ThemeDemo />} />
              
              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              
              {/* 404 Page */}
              <Route path="*" element={
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🔍</div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Page Not Found
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      The page you're looking for doesn't exist.
                    </p>
                    <button
                      onClick={() => window.location.href = '/'}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                      Go Home
                    </button>
                  </div>
                </div>
              } />
            </Routes>
          </ErrorBoundary>
        </main>
        
        <Footer />
      </div>
      
      {/* Global Toast Notifications */}
      <Toaster />
    </div>
  )
}

// Main App Component
function App() {
  return (
    <ErrorBoundary>
      <BrandProvider>
        <ThemeProvider>
          <GlobalLoaderProvider>
            <AppContent />
          </GlobalLoaderProvider>
        </ThemeProvider>
      </BrandProvider>
    </ErrorBoundary>
  )
}

export default App 