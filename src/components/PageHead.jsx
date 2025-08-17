import { useEffect } from 'react'
import { useBrand } from '../contexts/BrandContext'

export default function PageHead({
  title,
  description,
  keywords = [],
  image,
  url,
  type = 'website',
  noIndex = false,
  children
}) {
  const brand = useBrand()

  useEffect(() => {
    // Dynamic title with brand name
    const pageTitle = title ? `${brand.name} – ${title}` : brand.name
    document.title = pageTitle

    // Helper function to update or create meta tags
    const setMetaTag = (selector, content) => {
      if (!content) return

      let meta = document.querySelector(selector)
      if (!meta) {
        meta = document.createElement('meta')
        
        // Determine if it's a property or name attribute
        if (selector.includes('property=')) {
          const property = selector.match(/property="([^"]+)"/)?.[1]
          if (property) meta.setAttribute('property', property)
        } else if (selector.includes('name=')) {
          const name = selector.match(/name="([^"]+)"/)?.[1]
          if (name) meta.setAttribute('name', name)
        }
        
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', content)
    }

    // Update canonical link
    const setCanonical = (href) => {
      if (!href) return
      
      let canonical = document.querySelector('link[rel="canonical"]')
      if (!canonical) {
        canonical = document.createElement('link')
        canonical.setAttribute('rel', 'canonical')
        document.head.appendChild(canonical)
      }
      canonical.setAttribute('href', href)
    }

    // Primary meta tags
    setMetaTag('meta[name="title"]', pageTitle)
    setMetaTag('meta[name="description"]', description)
    setMetaTag('meta[name="keywords"]', keywords.length > 0 ? keywords.join(', ') : null)
    setMetaTag('meta[name="robots"]', noIndex ? 'noindex, nofollow' : 'index, follow')

    // Open Graph / Facebook
    setMetaTag('meta[property="og:title"]', pageTitle)
    setMetaTag('meta[property="og:description"]', description)
    setMetaTag('meta[property="og:type"]', type)
    setMetaTag('meta[property="og:url"]', url)
    setMetaTag('meta[property="og:image"]', image)

    // Twitter
    setMetaTag('meta[property="twitter:title"]', pageTitle)
    setMetaTag('meta[property="twitter:description"]', description)
    setMetaTag('meta[property="twitter:image"]', image)

    // Canonical URL
    setCanonical(url)

  }, [title, description, keywords, image, url, type, noIndex, brand])

  // This component doesn't render anything visible
  return children || null
}

// Pre-built page head components for common pages
export function HomePageHead() {
  const brand = useBrand()
  return (
    <PageHead
      title="Home"
      description={`Buy and sell quality cars with ${brand.name} - your trusted online car marketplace. Browse verified listings, get instant valuations, and enjoy hassle-free car buying experience.`}
      keywords={['cars', 'buy cars', 'sell cars', 'used cars', 'car marketplace', 'automotive']}
      url="https://bharatautobazaar.example/"
      image="https://bharatautobazaar.example/og-home.jpg"
    />
  )
}

export function BuyPageHead() {
  const brand = useBrand()
  return (
    <PageHead
      title="Buy Cars"
      description={`Browse our extensive collection of verified used cars. Find your perfect car with ${brand.name} - transparent pricing, quality assurance, and hassle-free buying.`}
      keywords={['buy cars', 'used cars', 'car listings', 'verified cars', 'car purchase']}
      url="https://bharatautobazaar.example/buy"
      image="https://bharatautobazaar.example/og-buy.jpg"
    />
  )
}

export function SellPageHead() {
  const brand = useBrand()
  return (
    <PageHead
      title="Sell Your Car"
      description={`Sell your car quickly and get the best price with ${brand.name}. Instant valuation, free inspection, and guaranteed sale within 24 hours.`}
      keywords={['sell car', 'car valuation', 'instant car sale', 'car inspection', 'quick sale']}
      url="https://bharatautobazaar.example/sell"
      image="https://bharatautobazaar.example/og-sell.jpg"
    />
  )
}

export function ListingPageHead({ listing }) {
  const brand = useBrand()
  
  if (!listing) {
    return (
      <PageHead
        title="Car Details"
        description={`View car details and specifications on ${brand.name}`}
        url="https://bharatautobazaar.example/listing"
      />
    )
  }

  return (
    <PageHead
      title={`${listing.make} ${listing.model} ${listing.year} - ₹${listing.price}`}
      description={`${listing.year} ${listing.make} ${listing.model} for sale - ₹${listing.price}. ${listing.km} km driven, ${listing.fuel} fuel, located in ${listing.city}. Verified by ${brand.name}.`}
      keywords={[listing.make, listing.model, listing.year, listing.fuel, 'used car', 'car sale']}
      url={`https://bharatautobazaar.example/listing/${listing.id}`}
      image={listing.images?.[0] || 'https://bharatautobazaar.example/og-listing.jpg'}
      type="product"
    />
  )
}

export function LoginPageHead() {
  return (
    <PageHead
      title="Login"
      description="Sign in to your Bharat Auto Bazaar account to manage your car listings, saved searches, and profile."
      url="https://bharatautobazaar.example/login"
      noIndex={true}
    />
  )
}

export function SignupPageHead() {
  return (
    <PageHead
      title="Sign Up"
      description="Create your Bharat Auto Bazaar account to start buying and selling cars. Join thousands of satisfied customers."
      url="https://bharatautobazaar.example/signup"
      noIndex={true}
    />
  )
}

export function DashboardPageHead() {
  return (
    <PageHead
      title="My Dashboard"
      description="Manage your car listings, track inquiries, and monitor your selling activity."
      url="https://bharatautobazaar.example/dashboard"
      noIndex={true}
    />
  )
}

export function AdminPageHead() {
  return (
    <PageHead
      title="Admin Dashboard"
      description="Admin portal for managing listings and user activities."
      url="https://bharatautobazaar.example/admin/dashboard"
      noIndex={true}
    />
  )
}

export function ThemePageHead() {
  return (
    <PageHead
      title="Theme Demo"
      description="Experience Bharat Auto Bazaar's dark and light mode themes with smooth animations and persistent settings."
      url="https://bharatautobazaar.example/theme-demo"
      keywords={['theme', 'dark mode', 'light mode', 'UI demo']}
      image="https://bharatautobazaar.example/og-theme.jpg"
    />
  )
} 