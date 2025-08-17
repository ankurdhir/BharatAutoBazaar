import React, { createContext, useContext, ReactNode } from 'react'

interface BrandConfig {
  name: string
  logo: string
  tagline: string
  primaryColor: string
  secondaryColor: string
  contactEmail: string
}

const BrandConfigContext = createContext<BrandConfig | undefined>(undefined)

const brandConfig: BrandConfig = {
  name: 'Bharat Auto Bazaar',
  logo: '/logo.svg',
  tagline: 'India\'s Premier Auto Marketplace',
  primaryColor: '#3F8CFF',
  secondaryColor: '#FDC500',
  contactEmail: 'contact@bharatautobazaar.com'
}

interface BrandConfigProviderProps {
  children: ReactNode
}

export function BrandConfigProvider({ children }: BrandConfigProviderProps) {
  return (
    <BrandConfigContext.Provider value={brandConfig}>
      {children}
    </BrandConfigContext.Provider>
  )
}

export const useBrandConfig = () => {
  const context = useContext(BrandConfigContext)
  if (!context) {
    throw new Error('useBrandConfig must be used within BrandConfigProvider')
  }
  return context
} 