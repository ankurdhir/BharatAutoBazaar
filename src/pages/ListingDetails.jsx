import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import { useBrand } from '../contexts/BrandContext'
import { useToast } from '../components/ui/use-toast'
import carService from '../services/carService'
import communicationService from '../services/communicationService'
import authService from '../services/authService'
import EMICalculator from '../components/EMICalculator'
import { getCarMainImageUrl, getCarImageUrl } from '../utils/imageUtils'

export default function ListingDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const brand = useBrand()
  const { toast } = useToast()

  // State management
  const [car, setCar] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [showContactModal, setShowContactModal] = useState(false)
  const [showEMICalculator, setShowEMICalculator] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
    contactTime: 'anytime'
  })
  const [contactSubmitting, setContactSubmitting] = useState(false)

  // EMI Calculator - now using frontend component

  // Load car details
  useEffect(() => {
    if (id) {
      loadCarDetails()
    }
  }, [id])

  // Pre-fill user data if logged in
  useEffect(() => {
    const user = authService.getCurrentUser()
    if (user) {
      setContactForm(prev => ({
        ...prev,
        name: user.name || '',
        phone: user.phone_number || '',
        email: user.email || ''
      }))
    }
  }, [])

  const loadCarDetails = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await carService.getCarById(id)
      
      if (result.success) {
        setCar(result.car)
      } else {
        if (result.notFound) {
          setError('Car listing not found')
        } else {
          setError(result.error)
        }
      }
    } catch (error) {
      setError('Failed to load car details. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Handle contact form submission
  const handleContactSubmit = async (e) => {
    e.preventDefault()
    
    if (!contactForm.name || !contactForm.phone || !contactForm.message) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setContactSubmitting(true)
    
    try {
      const result = await carService.contactSeller(id, {
        buyer_name: contactForm.name,
        buyer_phone: contactForm.phone,
        buyer_email: contactForm.email,
        message: contactForm.message,
        preferred_contact_time: contactForm.contactTime
      })

      if (result.success) {
        toast({
          title: "Message Sent Successfully!",
          description: "The seller will contact you soon",
        })
        setShowContactModal(false)
        setContactForm(prev => ({ ...prev, message: '' }))
      } else {
        toast({
          title: "Failed to Send Message",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Network Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setContactSubmitting(false)
    }
  }

  // EMI calculation is now handled by the EMICalculator component

  // Handle favorite toggle
  const toggleFavorite = async () => {
    if (!authService.isAuthenticated()) {
      toast({
        title: "Login Required",
        description: "Please login to save favorites",
        variant: "destructive",
      })
      return
    }

    try {
      if (isFavorite) {
        // Would need favorite ID to remove - simplified for demo
        toast({
          title: "Removed from Favorites",
          description: "Car removed from your favorites",
        })
        setIsFavorite(false)
      } else {
        const result = await carService.addToFavorites(id)
        if (result.success) {
          toast({
            title: "Added to Favorites",
            description: "Car added to your favorites",
          })
          setIsFavorite(true)
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive",
      })
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Image skeleton */}
            <div className="lg:col-span-2">
              <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mb-4"></div>
              <div className="grid grid-cols-4 gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
            
            {/* Details skeleton */}
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="space-y-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚗</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {error}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The car listing you're looking for doesn't exist or has been removed.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/buy')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Browse Other Cars
          </motion.button>
        </div>
      </div>
    )
  }

  if (!car) return null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
          <button onClick={() => navigate('/')} className="hover:text-blue-600">Home</button>
          <span>/</span>
          <button onClick={() => navigate('/buy')} className="hover:text-blue-600">Buy Cars</button>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">{carService.getCarDisplayName(car)}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images */}
          <div className="lg:col-span-2">
            {/* Main Image */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative h-96 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden mb-4"
            >
              {car.images && car.images.length > 0 ? (
                <img
                  src={getCarMainImageUrl(car, selectedImageIndex)}
                  alt={`${carService.getCarDisplayName(car)} - Image ${selectedImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-6xl">🚗</span>
                </div>
              )}
              
              {/* Image navigation */}
              {car.images && car.images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImageIndex(prev => 
                      prev > 0 ? prev - 1 : car.images.length - 1
                    )}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                  >
                    &#8249;
                  </button>
                  <button
                    onClick={() => setSelectedImageIndex(prev => 
                      prev < car.images.length - 1 ? prev + 1 : 0
                    )}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                  >
                    &#8250;
                  </button>
                </>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col space-y-2">
                {car.verified && (
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    ✓ Verified
                  </span>
                )}
                {car.featured && (
                  <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    ⭐ Featured
                  </span>
                )}
              </div>
            </motion.div>

            {/* Thumbnail Grid */}
            {car.images && car.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {car.images.slice(0, 8).map((image, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`h-24 rounded overflow-hidden border-2 transition-colors ${
                      selectedImageIndex === index
                        ? 'border-blue-500'
                        : 'border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <img
                      src={getCarImageUrl(image)}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </motion.button>
                ))}
              </div>
            )}

            {/* Car Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mt-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Car Specifications
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Brand</span>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{car.brand}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Model</span>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{car.car_model}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Year</span>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{car.year}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Fuel Type</span>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">{car.fuel_type}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Transmission</span>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">{car.transmission}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Kilometers Driven</span>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{car.km_driven?.toLocaleString()} km</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Owners</span>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{car.owner_number} owner</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Location</span>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{carService.getCarLocation(car)}</p>
                  </div>
                </div>
              </div>

              {/* Features */}
              {car.features && car.features.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Features</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {car.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="text-green-500">✓</span>
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {car.description && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Description</h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{car.description}</p>
                </div>
              )}

              {/* Watch detailed car video */}
              {car.video_url && (
                <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Watch detailed car video</h3>
                  <a
                    href={car.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 text-red-600 hover:text-red-700"
                    aria-label="Watch detailed car video on YouTube"
                  >
                    <svg viewBox="0 0 24 24" className="w-8 h-8" aria-hidden="true">
                      <path fill="currentColor" d="M23.498 6.186a3.005 3.005 0 0 0-2.116-2.116C19.414 3.5 12 3.5 12 3.5s-7.414 0-9.382.57A3.005 3.005 0 0 0 .502 6.186C-.066 8.154-.066 12-.066 12s0 3.846.568 5.814a3.005 3.005 0 0 0 2.116 2.116C4.586 20.5 12 20.5 12 20.5s7.414 0 9.382-.57a3.005 3.005 0 0 0 2.116-2.116C24.066 15.846 24.066 12 24.066 12s0-3.846-.568-5.814ZM9.75 15.568V8.432L15.818 12 9.75 15.568Z"/>
                    </svg>
                    <span className="font-medium">Watch on YouTube</span>
                  </a>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column - Price & Actions */}
          <div className="space-y-6">
            {/* Price Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sticky top-8"
            >
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {carService.getCarDisplayName(car)}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  📍 {carService.getCarLocation(car)}
                </p>
              </div>

              <div className="mb-6">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {carService.formatPrice(car.price)}
                </div>
                {car.original_price && car.original_price > car.price && (
                  <div className="text-lg text-gray-500 line-through">
                    {carService.formatPrice(car.original_price)}
                  </div>
                )}
                {car.video_url && (
                  <div className="mt-3">
                    <a
                      href={car.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-red-600 hover:text-red-700 font-medium"
                    >
                      <span className="mr-2">▶</span> View Car Video
                    </a>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowContactModal(true)}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  Contact Seller
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { window.location.href = 'tel:+919999800452' }}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  Call Now
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowEMICalculator(true)}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  Calculate EMI
                </motion.button>
              </div>

              {/* Seller Info removed */}

              {/* Last Updated */}
              <div className="mt-4 text-xs text-gray-500">
                Listed {carService.getRelativeTime(car.created_at)}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      <AnimatePresence>
        {showContactModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowContactModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Contact Seller
              </h3>

              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    value={contactForm.name}
                    onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Best Time to Contact
                  </label>
                  <select
                    value={contactForm.contactTime}
                    onChange={(e) => setContactForm(prev => ({ ...prev, contactTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="anytime">Anytime</option>
                    <option value="morning">Morning (9 AM - 12 PM)</option>
                    <option value="afternoon">Afternoon (12 PM - 5 PM)</option>
                    <option value="evening">Evening (5 PM - 9 PM)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Message *
                  </label>
                  <textarea
                    value={contactForm.message}
                    onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                    rows={4}
                    placeholder="Hi, I'm interested in this car. Could you please share more details?"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div className="flex space-x-3">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowContactModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={contactSubmitting}
                    className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50 transition-colors"
                  >
                    {contactSubmitting ? 'Sending...' : 'Send Message'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern EMI Calculator Modal */}
      <AnimatePresence>
        {showEMICalculator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowEMICalculator(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  EMI Calculator for {car?.title}
                </h3>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowEMICalculator(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>
              <div className="p-4">
                <EMICalculator carPrice={car?.price || 500000} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 