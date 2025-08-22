import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useBrand } from '../contexts/BrandContext'
import { useToast } from '../components/ui/use-toast'
import carService from '../services/carService'
import { getCarMainImageUrl } from '../utils/imageUtils'

export default function Home() {
  const brand = useBrand()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  // State management
  const [selectedCity, setSelectedCity] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [cities, setCities] = useState([])
  const [brands, setBrands] = useState([])
  const [featuredCars, setFeaturedCars] = useState([])
  const [loading, setLoading] = useState({
    cities: true,
    brands: true,
    featuredCars: true,
  })

  // Load initial data
  useEffect(() => {
    loadCities()
    loadBrands()
    // Featured cars section removed
  }, [])

  // Load cities from API
  const loadCities = async () => {
    try {
      const result = await carService.getCities()
      if (result.success && Array.isArray(result.cities)) {
        const map = new Map()
        result.cities.forEach(c => {
          const key = (c.name || '').toLowerCase()
          if (!map.has(key)) map.set(key, c)
        })
        setCities(Array.from(map.values()))
      } else {
        console.warn('Cities API returned unexpected format:', result)
        setCities([])
      }
    } catch (error) {
      console.error('Failed to load cities:', error)
      setCities([])
    } finally {
      setLoading(prev => ({ ...prev, cities: false }))
    }
  }

  // Load car brands from API
  const loadBrands = async () => {
    try {
      const result = await carService.getCarData()
      if (result.success && result.data && Array.isArray(result.data.brands)) {
        setBrands(result.data.brands)
      } else {
        console.warn('Brands API returned unexpected format:', result)
        setBrands([])
      }
    } catch (error) {
      console.error('Failed to load brands:', error)
      setBrands([])
    } finally {
      setLoading(prev => ({ ...prev, brands: false }))
    }
  }

  // Load featured cars from API
  // Featured cars loader removed

  // Handle search submission
  const handleSearch = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchQuery) params.set('search', searchQuery)
    if (selectedCity) params.set('city', selectedCity)
    navigate(`/buy?${params.toString()}`)
  }

  // Handle city selection
  const handleCitySelect = (city) => {
    setSelectedCity(city)
    navigate(`/buy?city=${encodeURIComponent(city)}`)
  }

  // Handle brand selection
  const handleBrandSelect = (brandName) => {
    navigate(`/buy?brand=${encodeURIComponent(brandName)}`)
  }

  // Static data for sections that don't need API
  const trustIndicators = [
    { number: '1,000+', label: 'Happy Customers' },
    { number: '500+', label: 'Cars Sold' },
    { number: '99%', label: 'Customer Satisfaction' },
    { number: '200+', label: 'Quality Checks' }
  ]

  const howItWorksSteps = [
    {
      step: '1',
      title: 'Search & Browse',
      description: 'Find your perfect car from our verified listings',
      icon: '🔍'
    },
    {
      step: '2',
      title: 'Inspect & Test Drive',
      description: 'Schedule inspection and test drive at your convenience',
      icon: '🚗'
    },
    {
      step: '3',
      title: 'Documentation',
      description: 'We handle all paperwork and documentation',
      icon: '📋'
    },
    {
      step: '4',
      title: 'Delivery',
      description: 'Get your car delivered to your doorstep',
      icon: '🏠'
    }
  ]

  const whyChooseUsFeatures = [
    {
      title: 'Verified Cars',
      description: '200+ quality checks on every car',
      icon: '✅'
    },
    {
      title: 'Best Price',
      description: 'Get the best deal with price matching',
      icon: '💰'
    },
    {
      title: 'Easy Financing',
      description: 'Get instant loan approval',
      icon: '🏦'
    },
    {
      title: 'Doorstep Delivery',
      description: 'Free home delivery nationwide',
      icon: '🚚'
    }
  ]

  // Popular Indian brands to highlight on homepage
  const popularBrandNames = ['Mahindra', 'Tata', 'Maruti Suzuki', 'Toyota', 'Skoda', 'Renault']
  // Simple Icons CDN slugs for quick, license-friendly SVG logos (fallback if API has no logo)
  const logoSlugMap = {
    'Mahindra': 'mahindra',
    'Tata': 'tata',
    'Maruti Suzuki': 'marutisuzuki',
    'Toyota': 'toyota',
    'Skoda': 'skoda',
    'Renault': 'renault',
  }
  const popularBrandList = popularBrandNames.map((name) => {
    const match = (brands || []).find(b => (b.name || '').toLowerCase() === name.toLowerCase())
    const slug = logoSlugMap[name]
    const cdnLogo = slug ? `https://cdn.simpleicons.org/${slug}` : null
    return { name, logo: match?.logo || cdnLogo }
  })

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Find Your Perfect
              <span className="block bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Pre-Owned Car
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              India's most trusted platform for buying and selling cars
            </p>

            {/* Trust Indicators */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              {trustIndicators.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-2xl md:text-3xl font-bold text-yellow-400">
                    {item.number}
                  </div>
                  <div className="text-sm md:text-base text-blue-100">
                    {item.label}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Search Bar */}
            <motion.form
              onSubmit={handleSearch}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-4xl mx-auto"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    What car are you looking for?
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g., Maruti Swift, Honda City..."
                    className="w-full px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Select City
                  </label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg text-gray-900 focus:ring-2 focus:ring-yellow-400"
                  >
                    <option value="">All Cities</option>
                    {Array.isArray(cities) && cities.map((city) => (
                      <option key={city.id} value={city.name}>
                        {city.name} ({city.car_count || 0} cars)
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-end">
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:from-yellow-500 hover:to-orange-600 transition-all duration-300"
                  >
                    🔍 Search Cars
                  </motion.button>
                </div>
              </div>
            </motion.form>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Link to="/buy">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
                >
                  🚗 Buy Car
                </motion.button>
              </Link>
              
              <Link to="/sell">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-blue-600 transition-all duration-300"
                >
                  💰 Sell Car
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Find Us On */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Find Us On
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Connect with Bharat Auto Bazaar
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 justify-items-center">
            <a href="https://instagram.com/bharatauttobazaar" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center text-gray-700 dark:text-gray-200">
              <img src="https://cdn.simpleicons.org/instagram" alt="Instagram" className="w-12 h-12" />
              <span className="mt-2">Instagram</span>
            </a>
            <a href="https://facebook.com/share/1WWLu8JxCy" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center text-gray-700 dark:text-gray-200">
              <img src="https://cdn.simpleicons.org/facebook" alt="Facebook" className="w-12 h-12" />
              <span className="mt-2">Facebook</span>
            </a>
            <a href="https://wa.me/919999800452" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center text-gray-700 dark:text-gray-200">
              <img src="https://cdn.simpleicons.org/whatsapp" alt="WhatsApp" className="w-12 h-12" />
              <span className="mt-2">WhatsApp</span>
            </a>
            <a href="tel:+919999800452" className="flex flex-col items-center text-gray-700 dark:text-gray-200">
              <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15 .86 0 1.704-.066 2.527-.194a2.25 2.25 0 001.873-2.224v-2.42a1.125 1.125 0 00-1.148-1.125c-.516.017-1.03.062-1.54.134a1.125 1.125 0 00-.958.75l-.532 1.596a13.5 13.5 0 01-6.516-6.516l1.596-.532a1.125 1.125 0 00.75-.958c.072-.51.117-1.024.134-1.54A1.125 1.125 0 0013.088 3h-2.42A2.25 2.25 0 008.444 4.873 16.72 16.72 0 002.25 6.75z" />
              </svg>
              <span className="mt-2">Call Us</span>
            </a>
          </div>
        </div>
      </section>

      {/* How Spinny Works */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How {brand.name} Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Simple, transparent, and hassle-free car buying experience
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorksSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-6xl mb-4">{step.icon}</div>
                <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Browse Cars by City */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Browse Cars by City
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Find cars available in your city
            </p>
          </motion.div>

          {loading.cities ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {cities.slice(0, 12).map((city, index) => (
                <motion.button
                  key={city.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCitySelect(city.name)}
                  className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700"
                >
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {city.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {city.carCount} cars
                  </p>
                </motion.button>
              ))}
            </div>
          )}

          <div className="text-center mt-8">
            <Link to="/buy">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                View All Cities
              </motion.button>
            </Link>
          </div>
        </div>
      </section>

      {/* Popular Brands (fixed popular Indian brands; click applies brand filter) */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Popular Brands
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Shop by your favorite car brands
            </p>
          </motion.div>

          {loading.brands ? (
            <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-6">
              {[...Array(16)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {popularBrandList.map((brand, index) => (
                <motion.button
                  key={brand.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleBrandSelect(brand.name)}
                  className="bg-white dark:bg-gray-700 rounded-lg p-4 text-center hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-600"
                >
                  {brand.logo ? (
                    <img
                      src={brand.logo}
                      alt={brand.name}
                      className="w-12 h-12 mx-auto mb-2 object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'block'
                      }}
                    />
                  ) : null}
                  <div 
                    className="w-12 h-12 mx-auto mb-2 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center text-2xl"
                    style={{ display: brand.logo ? 'none' : 'flex' }}
                  >
                    🚗
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {brand.name}
                  </h3>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Cars removed */}

      {/* Why Choose Us */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose {brand.name}?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              We make car buying simple, safe, and hassle-free
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {whyChooseUsFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white dark:bg-gray-700 rounded-xl p-6 text-center hover:shadow-lg transition-all duration-300"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
} 