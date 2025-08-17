import { useEffect } from 'react'
import { useBrand } from '../contexts/BrandContext'

export function usePageMeta({
  title,
  description,
  keywords = [],
  image,
  url,
  type = 'website',
  noIndex = false
}) {
  const brand = useBrand()

  useEffect(() => {
    // Dynamic title with brand name
    const pageTitle = title ? `${brand.name} – ${title}` : brand.name
    document.title = pageTitle

    // Update meta tags
    const updateMetaTag = (selector, content) => {
      let meta = document.querySelector(selector)
      if (!meta) {
        meta = document.createElement('meta')
        if (selector.includes('property=')) {
          meta.setAttribute('property', selector.match(/property="([^"]+)"/)[1])
        } else if (selector.includes('name=')) {
          meta.setAttribute('name', selector.match(/name="([^"]+)"/)[1])
        }
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', content)
    }

    // Primary meta tags
    updateMetaTag('meta[name="title"]', pageTitle)
    
    if (description) {
      updateMetaTag('meta[name="description"]', description)
    }

    if (keywords.length > 0) {
      updateMetaTag('meta[name="keywords"]', keywords.join(', '))
    }

    if (noIndex) {
      updateMetaTag('meta[name="robots"]', 'noindex, nofollow')
    } else {
      updateMetaTag('meta[name="robots"]', 'index, follow')
    }

    // Open Graph tags
    updateMetaTag('meta[property="og:title"]', pageTitle)
    updateMetaTag('meta[property="og:type"]', type)
    
    if (description) {
      updateMetaTag('meta[property="og:description"]', description)
    }

    if (url) {
      updateMetaTag('meta[property="og:url"]', url)
      // Update canonical link
      let canonical = document.querySelector('link[rel="canonical"]')
      if (!canonical) {
        canonical = document.createElement('link')
        canonical.setAttribute('rel', 'canonical')
        document.head.appendChild(canonical)
      }
      canonical.setAttribute('href', url)
    }

    if (image) {
      updateMetaTag('meta[property="og:image"]', image)
      updateMetaTag('meta[property="twitter:image"]', image)
    }

    // Twitter tags
    updateMetaTag('meta[property="twitter:title"]', pageTitle)
    
    if (description) {
      updateMetaTag('meta[property="twitter:description"]', description)
    }

    // Cleanup function to reset to default on unmount
    return () => {
      document.title = brand.name
    }
  }, [title, description, keywords, image, url, type, noIndex, brand])
}

// Pre-configured hooks for common page types
export function useHomeMeta() {
  const brand = useBrand()
  return usePageMeta({
    title: 'Home',
    description: `Buy and sell quality cars with ${brand.name} - your trusted online car marketplace. Browse verified listings, get instant valuations, and enjoy hassle-free car buying experience.`,
    keywords: ['cars', 'buy cars', 'sell cars', 'used cars', 'car marketplace', 'automotive'],
    url: 'https://spinny.app/',
    image: 'https://spinny.app/og-home.jpg'
  })
}

export function useBuyMeta() {
  const brand = useBrand()
  return usePageMeta({
    title: 'Buy Cars',
    description: `Browse our extensive collection of verified used cars. Find your perfect car with ${brand.name} - transparent pricing, quality assurance, and hassle-free buying.`,
    keywords: ['buy cars', 'used cars', 'car listings', 'verified cars', 'car purchase'],
    url: 'https://spinny.app/buy',
    image: 'https://spinny.app/og-buy.jpg'
  })
}

export function useSellMeta() {
  const brand = useBrand()
  return usePageMeta({
    title: 'Sell Your Car',
    description: `Sell your car quickly and get the best price with ${brand.name}. Instant valuation, free inspection, and guaranteed sale within 24 hours.`,
    keywords: ['sell car', 'car valuation', 'instant car sale', 'car inspection', 'quick sale'],
    url: 'https://spinny.app/sell',
    image: 'https://spinny.app/og-sell.jpg'
  })
}

export function useListingMeta({ listing }) {
  const brand = useBrand()
  if (!listing) return usePageMeta({ title: 'Car Details' })

  return usePageMeta({
    title: `${listing.make} ${listing.model} ${listing.year} - ₹${listing.price}`,
    description: `${listing.year} ${listing.make} ${listing.model} for sale - ₹${listing.price}. ${listing.km} km driven, ${listing.fuel} fuel, located in ${listing.city}. Verified by ${brand.name}.`,
    keywords: [listing.make, listing.model, listing.year, listing.fuel, 'used car', 'car sale'],
    url: `https://spinny.app/listing/${listing.id}`,
    image: listing.images?.[0] || 'https://spinny.app/og-listing.jpg',
    type: 'product'
  })
}

export function useLoginMeta() {
  return usePageMeta({
    title: 'Login',
    description: 'Sign in to your Spinny account to manage your car listings, saved searches, and profile.',
    url: 'https://spinny.app/login',
    noIndex: true
  })
}

export function useSignupMeta() {
  return usePageMeta({
    title: 'Sign Up',
    description: 'Create your Spinny account to start buying and selling cars. Join thousands of satisfied customers.',
    url: 'https://spinny.app/signup',
    noIndex: true
  })
}

export function useDashboardMeta() {
  return usePageMeta({
    title: 'My Dashboard',
    description: 'Manage your car listings, track inquiries, and monitor your selling activity.',
    url: 'https://spinny.app/dashboard',
    noIndex: true
  })
}

export function useAdminMeta() {
  return usePageMeta({
    title: 'Admin Dashboard',
    description: 'Admin portal for managing listings and user activities.',
    url: 'https://spinny.app/admin/dashboard',
    noIndex: true
  })
}

export function useThemeMeta() {
  return usePageMeta({
    title: 'Theme Demo',
    description: 'Experience Spinny\'s dark and light mode themes with smooth animations and persistent settings.',
    url: 'https://spinny.app/theme-demo',
    keywords: ['theme', 'dark mode', 'light mode', 'UI demo']
  })
} 