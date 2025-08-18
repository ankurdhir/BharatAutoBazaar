import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useBrand } from '../contexts/BrandContext'
import { useToast } from '../components/ui/use-toast'
import carService from '../services/carService'
import authService from '../services/authService'

export default function Sell() {
  const brand = useBrand()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  // Check authentication on load with proper initialization
  useEffect(() => {
    const checkAuthentication = () => {
      // Double check both authService state and localStorage
      const hasToken = authService.isAuthenticated() || localStorage.getItem('authToken')
      
      if (!hasToken) {
        toast({
          title: "Authentication Required",
          description: "Please login to sell your car",
          variant: "destructive",
        })
        // Add returnUrl parameter so user comes back to sell page after login
        navigate('/login?returnUrl=' + encodeURIComponent('/sell'))
      }
    }

    // Small delay to ensure authService has fully initialized
    const timeoutId = setTimeout(checkAuthentication, 100)
    
    // Cleanup timeout on component unmount
    return () => clearTimeout(timeoutId)
  }, [navigate, toast])

  // Form state
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  
  // API data
  const [brands, setBrands] = useState([])
  const [models, setModels] = useState([])
  const [variants, setVariants] = useState([])
  const [cities, setCities] = useState([])
  const [features, setFeatures] = useState({})
  const [systemConfig, setSystemConfig] = useState({})
  
  // Form data
  const [formData, setFormData] = useState({
    // Basic Details
    brand_name: '',
    model_name: '',
    variant_name: '',
    year: '',
    fuel_type: '',
    transmission: '',
    km_driven: '',
    owner_number: '1',
    
    // Pricing
    price: '',
    urgency: 'normal',
    
    // Condition
    exterior_condition: 'good',
    interior_condition: 'good',
    engine_condition: 'good',
    accident_history: 'none',
    
    // Location
    city_name: '',
    state_name: '',
    area: '',
    address: '',
    
    // Contact
    contact: {
      sellerName: '',
      phoneNumber: '',
      email: ''
    },
    
    // Features and Description
    features: [],
    description: '',
    
    // Files
    uploadedImages: [],
    uploadedVideos: []
  })

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [])

  // Load API data
  const loadInitialData = async () => {
    setLoading(true)
    try {
      const [brandsResult, citiesResult, featuresResult, configResult] = await Promise.all([
        carService.getCarData(),
        carService.getCities(),
        carService.getCarFeatures(),
        carService.getSystemConfig()
      ])

      if (brandsResult.success) setBrands(brandsResult.data.brands)
      if (citiesResult.success) setCities(citiesResult.cities)
      if (featuresResult.success) setFeatures(featuresResult.features)
      if (configResult.success) setSystemConfig(configResult.config)

      // Pre-fill user data if available
      const user = authService.getCurrentUser()
      if (user) {
        setFormData(prev => ({
          ...prev,
          contact: {
            sellerName: user.name || '',
            phoneNumber: user.phone_number || '',
            email: user.email || ''
          }
        }))
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load form data. Please refresh and try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Load models when brand changes
  useEffect(() => {
    if (formData.brand_name) {
      const selectedBrand = brands.find(b => b.name === formData.brand_name)
      if (selectedBrand) {
        setModels(selectedBrand.models || [])
        setFormData(prev => ({ ...prev, model_name: '', variant_name: '' }))
      }
    }
  }, [formData.brand_name, brands])

  // Load variants when model changes
  useEffect(() => {
    if (formData.model_name) {
      const selectedModel = models.find(m => m.name === formData.model_name)
      if (selectedModel) {
        setVariants(selectedModel.variants || [])
        setFormData(prev => ({ ...prev, variant_name: '' }))
      }
    }
  }, [formData.model_name, models])

  // State is no longer auto-filled from city; both are free text
  useEffect(() => {
    return
  }, [formData.city_name, cities])

  // Update form data
  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  // Update nested form data
  const updateNestedFormData = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }))
  }

  // Toggle feature
  const toggleFeature = (feature) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }))
  }

  // File upload handlers
  const handleImageUpload = async (files) => {
    if (!files || files.length === 0) return

    setLoading(true)
    try {
      const result = await carService.uploadCarImages(Array.from(files))
      if (result.success) {
        setFormData(prev => ({
          ...prev,
          uploadedImages: [...prev.uploadedImages, ...result.images]
        }))
        toast({
          title: "Images Uploaded",
          description: `${result.images.length} images uploaded successfully`,
        })
      } else {
        toast({
          title: "Upload Failed",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Upload Error",
        description: "Failed to upload images. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVideoUpload = async (file) => {
    if (!file) return

    setLoading(true)
    try {
      const result = await carService.uploadCarVideo(file)
      if (result.success) {
        setFormData(prev => ({
          ...prev,
          uploadedVideos: [...prev.uploadedVideos, result.video]
        }))
        toast({
          title: "Video Uploaded",
          description: "Video uploaded successfully",
        })
      } else {
        toast({
          title: "Upload Failed",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Upload Error",
        description: "Failed to upload video. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const removeImage = async (imageId) => {
    try {
      const result = await carService.deleteFile(imageId)
      if (result.success) {
        setFormData(prev => ({
          ...prev,
          uploadedImages: prev.uploadedImages.filter(img => img.id !== imageId)
        }))
      }
    } catch (error) {
      console.error('Failed to delete image:', error)
    }
  }

  const removeVideo = async (videoId) => {
    try {
      const result = await carService.deleteFile(videoId)
      if (result.success) {
        setFormData(prev => ({
          ...prev,
          uploadedVideos: prev.uploadedVideos.filter(vid => vid.id !== videoId)
        }))
      }
    } catch (error) {
      console.error('Failed to delete video:', error)
    }
  }

  // Validation
  const validateStep = (step) => {
    const newErrors = {}

    if (step === 1) {
      if (!formData.brand_name) newErrors.brand_name = 'Brand is required'
      if (!formData.model_name) newErrors.model_name = 'Model is required'
      if (!formData.variant_name) newErrors.variant_name = 'Variant is required'
      if (!formData.year) newErrors.year = 'Year is required'
      if (!formData.fuel_type) newErrors.fuel_type = 'Fuel type is required'
      if (!formData.transmission) newErrors.transmission = 'Transmission is required'
      if (!formData.km_driven) newErrors.km_driven = 'Kilometers driven is required'
    }

    if (step === 2) {
      if (!formData.price) newErrors.price = 'Price is required'
      if (formData.price && (formData.price < 10000 || formData.price > 10000000)) {
        newErrors.price = 'Price must be between ₹10,000 and ₹1 crore'
      }
    }

    if (step === 3) {
      if (!formData.city_name) newErrors.city_name = 'City is required'
      if (!formData.contact.sellerName) newErrors.sellerName = 'Seller name is required'
      if (!formData.contact.phoneNumber) newErrors.phoneNumber = 'Phone number is required'
    }

    if (step === 4) {
      if (formData.uploadedImages.length === 0) {
        newErrors.images = 'At least one image is required'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Navigation
  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(5, prev + 1))
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(1, prev - 1))
  }

  // Submit form
  const handleSubmit = async () => {
    if (!validateStep(4)) return

    setSubmitting(true)
    try {
      // Prepare submission data
      const submissionData = {
        brand_name: formData.brand_name,
        model_name: formData.model_name,
        variant_name: formData.variant_name || '',
        year: parseInt(formData.year),
        fuel_type: formData.fuel_type,
        transmission: formData.transmission,
        km_driven: parseInt(formData.km_driven),
        owner_number: formData.owner_number === '1' ? '1st' : 
                      formData.owner_number === '2' ? '2nd' :
                      formData.owner_number === '3' ? '3rd' : '4th+',
        price: parseInt(formData.price),
        urgency: formData.urgency,
        exterior_condition: formData.exterior_condition,
        interior_condition: formData.interior_condition,
        engine_condition: formData.engine_condition,
        accident_history: formData.accident_history,
        features: formData.features,
        city_name: formData.city_name,
        state_name: formData.state_name,
        area: formData.area || '',
        address: formData.address || '',
        description: formData.description || '',
        contact: formData.contact,
        image_ids: formData.uploadedImages.map(img => img.id)
      }

      console.log('Submission data being sent:', submissionData)
      const result = await carService.createCarListing(submissionData)

      console.log('Car listing submission result:', result)

      if (result.success) {
        setCurrentStep(5)
        toast({
          title: "Listing Created Successfully!",
          description: "Your car listing has been submitted for review",
        })
      } else {
        if (result.validationErrors) {
          console.log('Validation errors:', result.validationErrors)
          setErrors(result.validationErrors)
          // Show first validation error in toast
          const firstError = Object.values(result.validationErrors).flat()[0]
          toast({
            title: "Submission Failed",
            description: firstError || result.error,
            variant: "destructive",
          })
        } else {
          toast({
            title: "Submission Failed",
            description: result.error,
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      toast({
        title: "Submission Error",
        description: "Failed to submit listing. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Generate years array
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading form data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Sell Your Car
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Get the best price for your car with our hassle-free process
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mt-8">
            <div className="flex items-center justify-center">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <motion.div
                    initial={false}
                    animate={{
                      backgroundColor: step <= currentStep ? brand.primaryColor : '#e5e7eb',
                      scale: step === currentStep ? 1.1 : 1
                    }}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                  >
                    {step < currentStep ? '✓' : step}
                  </motion.div>
                  {step < 4 && (
                    <div 
                      className={`w-16 h-1 ${step < currentStep ? 'bg-blue-500' : 'bg-gray-300'}`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-600 dark:text-gray-400">
              <span>Car Details</span>
              <span>Pricing</span>
              <span>Contact Info</span>
              <span>Photos & Submit</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <AnimatePresence mode="wait">
            {/* Step 1: Car Details */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                  Car Details
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Brand */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Brand *
                    </label>
                    <input
                      type="text"
                      value={formData.brand_name}
                      onChange={(e) => updateFormData('brand_name', e.target.value)}
                      placeholder="Enter car brand (e.g., Toyota, Honda, BMW)"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    {errors.brand_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.brand_name}</p>
                    )}
                  </div>

                  {/* Model */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Model *
                    </label>
                    <input
                      type="text"
                      value={formData.model_name}
                      onChange={(e) => updateFormData('model_name', e.target.value)}
                      placeholder="Enter car model (e.g., Camry, Civic, X3)"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    {errors.model_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.model_name}</p>
                    )}
                  </div>

                  {/* Variant */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Variant *
                    </label>
                    <input
                      type="text"
                      value={formData.variant_name}
                      onChange={(e) => updateFormData('variant_name', e.target.value)}
                      placeholder="Enter variant (e.g., VXi, ZXi, Alpha)"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    {errors.variant_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.variant_name}</p>
                    )}
                  </div>

                  {/* Year */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Year *
                    </label>
                    <select
                      value={formData.year}
                      onChange={(e) => updateFormData('year', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select Year</option>
                      {years.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                    {errors.year && (
                      <p className="mt-1 text-sm text-red-600">{errors.year}</p>
                    )}
                  </div>

                  {/* Fuel Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Fuel Type *
                    </label>
                    <select
                      value={formData.fuel_type}
                      onChange={(e) => updateFormData('fuel_type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select Fuel Type</option>
                      <option value="petrol">Petrol</option>
                      <option value="diesel">Diesel</option>
                      <option value="cng">CNG</option>
                      <option value="electric">Electric</option>
                    </select>
                    {errors.fuel_type && (
                      <p className="mt-1 text-sm text-red-600">{errors.fuel_type}</p>
                    )}
                  </div>

                  {/* Transmission */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Transmission *
                    </label>
                    <select
                      value={formData.transmission}
                      onChange={(e) => updateFormData('transmission', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select Transmission</option>
                      <option value="manual">Manual</option>
                      <option value="automatic">Automatic</option>
                    </select>
                    {errors.transmission && (
                      <p className="mt-1 text-sm text-red-600">{errors.transmission}</p>
                    )}
                  </div>

                  {/* Kilometers Driven */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Kilometers Driven *
                    </label>
                    <input
                      type="number"
                      value={formData.km_driven}
                      onChange={(e) => updateFormData('km_driven', e.target.value)}
                      placeholder="e.g., 25000"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    {errors.km_driven && (
                      <p className="mt-1 text-sm text-red-600">{errors.km_driven}</p>
                    )}
                  </div>

                  {/* Owner Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Number of Owners
                    </label>
                    <select
                      value={formData.owner_number}
                      onChange={(e) => updateFormData('owner_number', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="1">1st Owner</option>
                      <option value="2">2nd Owner</option>
                      <option value="3">3rd Owner</option>
                      <option value="4">4+ Owners</option>
                    </select>
                  </div>
                </div>

                {/* Car Condition */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Car Condition
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Exterior Condition
                      </label>
                      <select
                        value={formData.exterior_condition}
                        onChange={(e) => updateFormData('exterior_condition', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="excellent">Excellent</option>
                        <option value="good">Good</option>
                        <option value="fair">Fair</option>
                        <option value="poor">Poor</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Interior Condition
                      </label>
                      <select
                        value={formData.interior_condition}
                        onChange={(e) => updateFormData('interior_condition', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="excellent">Excellent</option>
                        <option value="good">Good</option>
                        <option value="fair">Fair</option>
                        <option value="poor">Poor</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Engine Condition
                      </label>
                      <select
                        value={formData.engine_condition}
                        onChange={(e) => updateFormData('engine_condition', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="excellent">Excellent</option>
                        <option value="good">Good</option>
                        <option value="fair">Fair</option>
                        <option value="poor">Poor</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Accident History */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Accident History
                  </label>
                  <select
                    value={formData.accident_history}
                    onChange={(e) => updateFormData('accident_history', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="none">No Accidents</option>
                    <option value="minor">Minor Accidents (Repaired)</option>
                    <option value="major">Major Accidents (Repaired)</option>
                  </select>
                </div>
              </motion.div>
            )}

            {/* Step 2: Pricing */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                  Pricing & Urgency
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Expected Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Expected Price (₹) *
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => updateFormData('price', e.target.value)}
                      placeholder="e.g., 650000"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    {errors.price && (
                      <p className="mt-1 text-sm text-red-600">{errors.price}</p>
                    )}
                    <p className="mt-1 text-sm text-gray-500">
                      Our experts will help you get the best price
                    </p>
                  </div>

                  {/* Selling Urgency */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      How urgent is your sale?
                    </label>
                    <select
                      value={formData.urgency}
                      onChange={(e) => updateFormData('urgency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="normal">Normal (Within 3 months)</option>
                      <option value="urgent">Urgent (Within 1 month)</option>
                      <option value="very_urgent">Very Urgent (Within 2 weeks)</option>
                    </select>
                  </div>
                </div>

                {/* Features */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Car Features (Select all that apply)
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {Object.entries(features).map(([category, categoryFeatures]) => 
                      categoryFeatures?.map(feature => (
                        <motion.button
                          key={`${category}-${feature.name}`}
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => toggleFeature(feature.name)}
                          className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                            formData.features.includes(feature.name)
                              ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                              : 'border-gray-300 bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:border-blue-300'
                          }`}
                        >
                          {feature.icon && <span className="mr-1">{feature.icon}</span>}
                          {feature.name}
                        </motion.button>
                      ))
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Additional Description (Optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateFormData('description', e.target.value)}
                    rows={4}
                    placeholder="Tell us more about your car, any modifications, recent services, etc."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    {formData.description.length}/500 characters
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 3: Contact & Location */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                  Contact & Location Information
                </h2>

                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={formData.contact.sellerName}
                        onChange={(e) => updateNestedFormData('contact', 'sellerName', e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      {errors.sellerName && (
                        <p className="mt-1 text-sm text-red-600">{errors.sellerName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={formData.contact.phoneNumber}
                        onChange={(e) => updateNestedFormData('contact', 'phoneNumber', e.target.value)}
                        placeholder="Enter your phone number"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      {errors.phoneNumber && (
                        <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email Address (Optional)
                      </label>
                      <input
                        type="email"
                        value={formData.contact.email}
                        onChange={(e) => updateNestedFormData('contact', 'email', e.target.value)}
                        placeholder="Enter your email address"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Location Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Location Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        value={formData.city_name}
                        onChange={(e) => updateFormData('city_name', e.target.value)}
                        placeholder="Enter your city"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      {errors.city_name && (
                        <p className="mt-1 text-sm text-red-600">{errors.city_name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        State
                      </label>
                      <input
                        type="text"
                        value={formData.state_name}
                        onChange={(e) => updateFormData('state_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Enter your state"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Area/Locality (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.area}
                        onChange={(e) => updateFormData('area', e.target.value)}
                        placeholder="e.g., Sector 62, Andheri West"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Full Address (Optional)
                      </label>
                      <textarea
                        value={formData.address}
                        onChange={(e) => updateFormData('address', e.target.value)}
                        rows={3}
                        placeholder="Complete address for inspection"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Photos & Submit */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                  Photos & Videos
                </h2>

                {/* Image Upload */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Car Photos * (Required)
                  </h3>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files)}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <div className="text-4xl mb-4">📸</div>
                      <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Upload Car Photos
                      </p>
                      <p className="text-sm text-gray-500 text-center">
                        Add multiple photos from different angles. Maximum {systemConfig.limits?.maxImagesPerListing || 10} images.
                      </p>
                    </label>
                  </div>

                  {/* Uploaded Images */}
                  {formData.uploadedImages.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      {formData.uploadedImages.map((image, index) => (
                        <div key={image.id} className="relative">
                          <img
                            src={image.thumbnail || image.url}
                            alt={`Car photo ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(image.id)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {errors.images && (
                    <p className="mt-2 text-sm text-red-600">{errors.images}</p>
                  )}
                </div>

                {/* Video Upload removed - images only */}

                {/* Submit Button */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Ready to Submit?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Your listing will be reviewed by our team and published within 24-48 hours.
                    We'll contact you to schedule an inspection.
                  </p>
                  <motion.button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white py-4 rounded-lg font-semibold text-lg transition-colors"
                  >
                    {submitting ? (
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Submitting Listing...
                      </div>
                    ) : (
                      'Submit Car Listing'
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Step 5: Success */}
            {currentStep === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="text-6xl mb-6">🎉</div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Listing Submitted Successfully!
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
                  Thank you for choosing {brand.name}. Your car listing is now under review.
                </p>
                
                <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-6 mb-8">
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
                    What happens next?
                  </h3>
                  <div className="text-left space-y-3 text-blue-800 dark:text-blue-200">
                    <div className="flex items-center">
                      <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm mr-3">1</span>
                      Our team will review your listing (24-48 hours)
                    </div>
                    <div className="flex items-center">
                      <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm mr-3">2</span>
                      We'll schedule a professional inspection
                    </div>
                    <div className="flex items-center">
                      <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm mr-3">3</span>
                      Your listing goes live after approval
                    </div>
                    <div className="flex items-center">
                      <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm mr-3">4</span>
                      Start receiving inquiries from buyers
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/dashboard')}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                  >
                    View Dashboard
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/')}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Back to Home
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          {currentStep < 5 && (
            <div className="flex justify-between mt-8">
              <motion.button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </motion.button>

              {currentStep < 4 && (
                <motion.button
                  type="button"
                  onClick={nextStep}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Next Step
                </motion.button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 