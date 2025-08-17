import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBrand } from '../contexts/BrandContext'

export default function ImageUploader({ images = [], onChange, maxImages = 5, maxSizePerFile = 5 * 1024 * 1024 }) {
  const [dragActive, setDragActive] = useState(false)
  const [errors, setErrors] = useState([])
  const brand = useBrand()

  const validateFile = (file) => {
    const errors = []
    
    if (!file.type.startsWith('image/')) {
      errors.push('File must be an image')
    }
    
    if (file.size > maxSizePerFile) {
      errors.push(`File size must be less than ${Math.round(maxSizePerFile / 1024 / 1024)}MB`)
    }
    
    return errors
  }

  const handleFiles = useCallback((files) => {
    const fileArray = Array.from(files)
    const newErrors = []
    const validFiles = []

    // Check if adding these files would exceed max limit
    if (images.length + fileArray.length > maxImages) {
      newErrors.push(`Maximum ${maxImages} images allowed`)
      setErrors(newErrors)
      return
    }

    fileArray.forEach((file, index) => {
      const fileErrors = validateFile(file)
      if (fileErrors.length > 0) {
        newErrors.push(`File ${index + 1}: ${fileErrors.join(', ')}`)
      } else {
        // Create preview URL
        const preview = URL.createObjectURL(file)
        validFiles.push({
          id: Math.random().toString(36).substr(2, 9),
          file,
          preview,
          name: file.name,
          size: file.size
        })
      }
    })

    if (newErrors.length > 0) {
      setErrors(newErrors)
    } else {
      setErrors([])
      onChange([...images, ...validFiles])
    }
  }, [images, maxImages, maxSizePerFile, onChange])

  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  const handleInputChange = useCallback((e) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files)
    }
  }, [handleFiles])

  const removeImage = (id) => {
    const updatedImages = images.filter(img => img.id !== id)
    onChange(updatedImages)
    
    // Revoke URL to prevent memory leaks
    const removedImage = images.find(img => img.id === id)
    if (removedImage?.preview) {
      URL.revokeObjectURL(removedImage.preview)
    }
  }

  const moveImage = (fromIndex, toIndex) => {
    const newImages = [...images]
    const [movedImage] = newImages.splice(fromIndex, 1)
    newImages.splice(toIndex, 0, movedImage)
    onChange(newImages)
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200 ${
          dragActive
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="space-y-2">
          <div className="text-4xl">📸</div>
          <div>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              Upload Images
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Drag and drop images here, or click to select files
            </p>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500">
            Maximum {maxImages} images, {Math.round(maxSizePerFile / 1024 / 1024)}MB each
          </div>
        </div>
      </div>

      {/* Error Messages */}
      <AnimatePresence>
        {errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3"
          >
            {errors.map((error, index) => (
              <p key={index} className="text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <AnimatePresence>
            {images.map((image, index) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative group bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
              >
                <div className="aspect-square">
                  <img
                    src={image.preview}
                    alt={image.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Image Controls */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 space-x-2">
                    {/* Move Left */}
                    {index > 0 && (
                      <button
                        onClick={() => moveImage(index, index - 1)}
                        className="p-1 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                    )}
                    
                    {/* Remove */}
                    <button
                      onClick={() => removeImage(image.id)}
                      className="p-1 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    
                    {/* Move Right */}
                    {index < images.length - 1 && (
                      <button
                        onClick={() => moveImage(index, index + 1)}
                        className="p-1 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* File Info */}
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2">
                  <p className="text-xs truncate">{image.name}</p>
                  <p className="text-xs text-gray-300">{formatFileSize(image.size)}</p>
                </div>

                {/* Primary Indicator */}
                {index === 0 && (
                  <div 
                    className="absolute top-2 left-2 px-2 py-1 text-xs font-bold text-white rounded"
                    style={{ backgroundColor: brand.primaryColor }}
                  >
                    Primary
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Upload Stats */}
      {images.length > 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {images.length} of {maxImages} images uploaded
        </div>
      )}
    </div>
  )
} 