import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBrand } from '../contexts/BrandContext'
import { useToast } from './ui/use-toast'
import emailService from '../services/emailService'
import ImageUploader from './ImageUploader'
import VideoUploader from './VideoUploader'

const STEPS = ['Car Details', 'Media Upload', 'Preview']

const carMakes = ['Honda', 'Toyota', 'BMW', 'Mercedes', 'Audi', 'Ford', 'Nissan', 'Hyundai', 'Kia', 'Volkswagen']
const fuelTypes = ['Gasoline', 'Diesel', 'Hybrid', 'Electric', 'CNG']
const transmissionTypes = ['Manual', 'Automatic', 'CVT']
const ownershipTypes = ['First Owner', 'Second Owner', 'Third Owner', 'Fourth+ Owner']
const cities = ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Edmonton', 'Ottawa', 'Winnipeg', 'Halifax']

function StepIndicator({ currentStep, steps }) {
  const brand = useBrand()
  
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center">
          <div className="flex flex-col items-center">
            <motion.div
              initial={false}
              animate={{
                backgroundColor: index <= currentStep ? brand.primaryColor : '#e5e7eb',
                scale: index === currentStep ? 1.1 : 1
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
            >
              {index < currentStep ? '✓' : index + 1}
            </motion.div>
            <span className={`mt-2 text-xs font-medium ${
              index <= currentStep ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
            }`}>
              {step}
            </span>
          </div>
          {index < steps.length - 1 && (
            <motion.div
              initial={false}
              animate={{
                backgroundColor: index < currentStep ? brand.primaryColor : '#e5e7eb'
              }}
              className="w-12 h-1 mx-4 rounded-full"
            />
          )}
        </div>
      ))}
    </div>
  )
}

function CarDetailsStep({ formData, onChange, errors }) {
  const brand = useBrand()

  const handleChange = (field, value) => {
    onChange({
      ...formData,
      [field]: value
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Car Details</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Make */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Make *
          </label>
          <select
            value={formData.make}
            onChange={(e) => handleChange('make', e.target.value)}
            className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 dark:bg-gray-800 dark:text-white transition-colors duration-200 ${
              errors.make ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
            }`}
            style={{ focusRingColor: brand.primaryColor }}
          >
            <option value="">Select Make</option>
            {carMakes.map(make => (
              <option key={make} value={make}>{make}</option>
            ))}
          </select>
          {errors.make && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.make}</p>}
        </div>

        {/* Model */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Model *
          </label>
          <input
            type="text"
            value={formData.model}
            onChange={(e) => handleChange('model', e.target.value)}
            className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 dark:bg-gray-800 dark:text-white transition-colors duration-200 ${
              errors.model ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
            }`}
            style={{ focusRingColor: brand.primaryColor }}
            placeholder="e.g., Civic, Camry, 3 Series"
          />
          {errors.model && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.model}</p>}
        </div>

        {/* Year */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Year *
          </label>
          <input
            type="number"
            min="1980"
            max={new Date().getFullYear() + 1}
            value={formData.year}
            onChange={(e) => handleChange('year', e.target.value)}
            className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 dark:bg-gray-800 dark:text-white transition-colors duration-200 ${
              errors.year ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
            }`}
            style={{ focusRingColor: brand.primaryColor }}
            placeholder="2020"
          />
          {errors.year && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.year}</p>}
        </div>

        {/* Fuel Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Fuel Type *
          </label>
          <select
            value={formData.fuelType}
            onChange={(e) => handleChange('fuelType', e.target.value)}
            className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 dark:bg-gray-800 dark:text-white transition-colors duration-200 ${
              errors.fuelType ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
            }`}
            style={{ focusRingColor: brand.primaryColor }}
          >
            <option value="">Select Fuel Type</option>
            {fuelTypes.map(fuel => (
              <option key={fuel} value={fuel}>{fuel}</option>
            ))}
          </select>
          {errors.fuelType && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.fuelType}</p>}
        </div>

        {/* Transmission */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Transmission *
          </label>
          <select
            value={formData.transmission}
            onChange={(e) => handleChange('transmission', e.target.value)}
            className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 dark:bg-gray-800 dark:text-white transition-colors duration-200 ${
              errors.transmission ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
            }`}
            style={{ focusRingColor: brand.primaryColor }}
          >
            <option value="">Select Transmission</option>
            {transmissionTypes.map(trans => (
              <option key={trans} value={trans}>{trans}</option>
            ))}
          </select>
          {errors.transmission && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.transmission}</p>}
        </div>

        {/* Kilometers */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Kilometers *
          </label>
          <input
            type="number"
            min="0"
            value={formData.kilometers}
            onChange={(e) => handleChange('kilometers', e.target.value)}
            className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 dark:bg-gray-800 dark:text-white transition-colors duration-200 ${
              errors.kilometers ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
            }`}
            style={{ focusRingColor: brand.primaryColor }}
            placeholder="50000"
          />
          {errors.kilometers && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.kilometers}</p>}
        </div>

        {/* Ownership */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Ownership *
          </label>
          <select
            value={formData.ownership}
            onChange={(e) => handleChange('ownership', e.target.value)}
            className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 dark:bg-gray-800 dark:text-white transition-colors duration-200 ${
              errors.ownership ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
            }`}
            style={{ focusRingColor: brand.primaryColor }}
          >
            <option value="">Select Ownership</option>
            {ownershipTypes.map(owner => (
              <option key={owner} value={owner}>{owner}</option>
            ))}
          </select>
          {errors.ownership && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.ownership}</p>}
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Price (CAD) *
          </label>
          <input
            type="number"
            min="0"
            value={formData.price}
            onChange={(e) => handleChange('price', e.target.value)}
            className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 dark:bg-gray-800 dark:text-white transition-colors duration-200 ${
              errors.price ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
            }`}
            style={{ focusRingColor: brand.primaryColor }}
            placeholder="25000"
          />
          {errors.price && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.price}</p>}
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            City *
          </label>
          <select
            value={formData.city}
            onChange={(e) => handleChange('city', e.target.value)}
            className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 dark:bg-gray-800 dark:text-white transition-colors duration-200 ${
              errors.city ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
            }`}
            style={{ focusRingColor: brand.primaryColor }}
          >
            <option value="">Select City</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
          {errors.city && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.city}</p>}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={4}
          className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 dark:bg-gray-800 dark:text-white transition-colors duration-200"
          style={{ focusRingColor: brand.primaryColor }}
          placeholder="Describe your car's condition, features, service history, etc."
        />
      </div>
    </motion.div>
  )
}

function MediaUploadStep({ formData, onChange }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Media Upload</h2>
      
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Car Images
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Upload up to 5 high-quality images of your car. The first image will be the primary photo.
          </p>
          <ImageUploader
            images={formData.images}
            onChange={(images) => onChange({ ...formData, images })}
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Car Video (Optional)
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Upload a video showcasing your car's exterior, interior, and engine.
          </p>
          <VideoUploader
            video={formData.video}
            onChange={(video) => onChange({ ...formData, video })}
          />
        </div>
      </div>
    </motion.div>
  )
}

function PreviewStep({ formData, onSubmit, submitting }) {
  const brand = useBrand()

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0
    }).format(price)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Preview Listing</h2>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        {/* Images */}
        {formData.images.length > 0 && (
          <div className="aspect-video bg-gray-100 dark:bg-gray-700 relative">
            <img
              src={formData.images[0].preview}
              alt="Car"
              className="w-full h-full object-cover"
            />
            {formData.images.length > 1 && (
              <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                +{formData.images.length - 1} more
              </div>
            )}
          </div>
        )}

        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {formData.year} {formData.make} {formData.model}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">{formData.city}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold" style={{ color: brand.primaryColor }}>
                {formatPrice(formData.price)}
              </div>
            </div>
          </div>

          {/* Specs Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">Kilometers</div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {parseInt(formData.kilometers).toLocaleString()} km
              </div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">Fuel</div>
              <div className="font-semibold text-gray-900 dark:text-white">{formData.fuelType}</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">Transmission</div>
              <div className="font-semibold text-gray-900 dark:text-white">{formData.transmission}</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">Ownership</div>
              <div className="font-semibold text-gray-900 dark:text-white">{formData.ownership}</div>
            </div>
          </div>

          {/* Description */}
          {formData.description && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Description</h4>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{formData.description}</p>
            </div>
          )}

          {/* Media Count */}
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-6">
            <span>📸 {formData.images.length} photos</span>
            {formData.video && <span>🎥 1 video</span>}
          </div>

          {/* Submit Button */}
          <motion.button
            onClick={onSubmit}
            disabled={submitting}
            whileHover={{ scale: submitting ? 1 : 1.02 }}
            whileTap={{ scale: submitting ? 1 : 0.98 }}
            style={{ backgroundColor: brand.primaryColor }}
            className="w-full py-4 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                 {isEditing ? 'Updating' : 'Publishing'} Listing...
              </div>
            ) : (
                             isEditing ? 'Update Listing' : 'Publish Listing'
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

export default function ListingForm({ initialData, onSubmit, isEditing = false }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState(initialData || {
    make: '',
    model: '',
    year: '',
    fuelType: '',
    transmission: '',
    kilometers: '',
    ownership: '',
    price: '',
    city: '',
    description: '',
    images: [],
    video: null
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const brand = useBrand()
  const { toast } = useToast()

  const validateStep = (step) => {
    const newErrors = {}

    if (step === 0) {
      // Car Details validation
      const requiredFields = ['make', 'model', 'year', 'fuelType', 'transmission', 'kilometers', 'ownership', 'price', 'city']
      
      requiredFields.forEach(field => {
        if (!formData[field] || formData[field].toString().trim() === '') {
          newErrors[field] = 'This field is required'
        }
      })

      // Additional validations
      if (formData.year && (formData.year < 1980 || formData.year > new Date().getFullYear() + 1)) {
        newErrors.year = 'Please enter a valid year'
      }
      
      if (formData.kilometers && formData.kilometers < 0) {
        newErrors.kilometers = 'Kilometers cannot be negative'
      }
      
      if (formData.price && formData.price <= 0) {
        newErrors.price = 'Price must be greater than 0'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1))
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      if (onSubmit) {
        onSubmit(formData)
      }
      
      if (isEditing) {
        // Show toast for edit submission
        toast({
          title: "Listing Updated",
          description: "Your listing has been updated and is pending approval.",
          variant: "success",
        })
        
        // Send email notification
        await emailService.sendListingSubmittedNotification(
          { title: formData.make + ' ' + formData.model + ' ' + formData.year },
          'seller@example.com' // In real app, get from user context
        )
      } else {
        // Show toast for new submission
        toast({
          title: "Listing Submitted",
          description: "Listing submitted, pending approval. You'll receive an email confirmation shortly.",
          variant: "success",
        })
        
        // Send notifications
        await Promise.all([
          // Email to seller
          emailService.sendListingSubmittedNotification(
            { title: formData.make + ' ' + formData.model + ' ' + formData.year },
            'seller@example.com'
          ),
          // Email to admin
          emailService.sendAdminNewListingNotification(
            { title: formData.make + ' ' + formData.model + ' ' + formData.year },
            'John Doe',
            'admin@bharatautobazaar.com'
          )
        ])
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? 'update' : 'publish'} listing. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {isEditing ? 'Edit Your Listing' : 'List Your Car'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isEditing ? 'Update your car listing details' : 'Fill in the details to create your car listing'}
          </p>
        </div>

        <StepIndicator currentStep={currentStep} steps={STEPS} />

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8">
          <AnimatePresence mode="wait">
            {currentStep === 0 && (
              <CarDetailsStep
                key="details"
                formData={formData}
                onChange={setFormData}
                errors={errors}
              />
            )}
            {currentStep === 1 && (
              <MediaUploadStep
                key="media"
                formData={formData}
                onChange={setFormData}
              />
            )}
            {currentStep === 2 && (
              <PreviewStep
                key="preview"
                formData={formData}
                onSubmit={handleSubmit}
                submitting={submitting}
              />
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="px-6 py-3 text-gray-600 dark:text-gray-400 font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {currentStep < STEPS.length - 1 ? (
              <motion.button
                onClick={nextStep}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ backgroundColor: brand.primaryColor }}
                className="px-6 py-3 text-white font-medium rounded-lg hover:opacity-90 transition-opacity duration-200"
              >
                Next Step
              </motion.button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
} 