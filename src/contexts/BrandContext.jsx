import { createContext, useContext } from 'react'

const BrandContext = createContext()

const brandConfig = {
  name: 'Bharat Auto Bazaar',
  logo: '/logo.svg',
  tagline: 'India\'s Premier Auto Marketplace',
  primaryColor: '#3b82f6',
  secondaryColor: '#64748b',
  contactEmail: 'contact@bharatautobazaar.com'
}

export function BrandProvider({ children }) {
  return (
    <BrandContext.Provider value={brandConfig}>
      {children}
    </BrandContext.Provider>
  )
}

export const useBrand = () => {
  const context = useContext(BrandContext)
  if (!context) {
    throw new Error('useBrand must be used within BrandProvider')
  }
  return context
} 