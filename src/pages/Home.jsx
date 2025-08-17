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
    loadFeaturedCars()
  }, [])

  // Load cities from API
  const loadCities = async () => {
    try {
      const result = await carService.getCities()
      if (result.success && Array.isArray(result.cities)) {
        setCities(result.cities)
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
  const loadFeaturedCars = async () => {
    try {
      const result = await carService.getCars({
        featured: true,
        limit: 8,
        sortBy: 'created_desc'
      })
      if (result.success) {
        setFeaturedCars(result.data.cars || [])
      }
    } catch (error) {
      console.error('Failed to load featured cars:', error)
    } finally {
      setLoading(prev => ({ ...prev, featuredCars: false }))
    }
  }

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
    { number: '50,000+', label: 'Happy Customers' },
    { number: '15,000+', label: 'Cars Sold' },
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

      {/* Popular Brands */}
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
            <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-6">
              {brands.slice(0, 16).map((brand, index) => (
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

      {/* Featured Cars */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Featured Cars
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Hand-picked premium cars just for you
            </p>
          </motion.div>

          {loading.featuredCars ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                  <div className="h-48 bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : featuredCars.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredCars.map((car, index) => (
                <motion.div
                  key={car.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300"
                  onClick={() => navigate(`/listing/${car.id}`)}
                >
                  <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
                    {car.images && car.images.length > 0 ? (
                      <img
                        src={getCarMainImageUrl(car)}
                        alt={carService.getCarDisplayName(car)}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = '/api/placeholder/400/240'
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-4xl">🚗</span>
                      </div>
                    )}
                    
                    <div className="absolute top-3 left-3 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                      ⭐ Featured
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {carService.getCarDisplayName(car)}
                    </h3>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      📍 {carService.getCarLocation(car)}
                    </p>

                    <div className="flex items-center justify-between">
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {carService.formatPrice(car.price)}
                      </p>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/listing/${car.id}`)
                        }}
                      >
                        View Details
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🚗</div>
              <p className="text-gray-600 dark:text-gray-400">
                No featured cars available at the moment
              </p>
            </div>
          )}

          <div className="text-center mt-8">
            <Link to="/buy">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                View All Cars
              </motion.button>
            </Link>
          </div>
        </div>
      </section>

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