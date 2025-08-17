import React, { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBrand } from '../contexts/BrandContext'

export default function VideoUploader({ video, onChange, maxSize = 20 * 1024 * 1024 }) {
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const brand = useBrand()

  const generateThumbnail = (videoFile) => {
    return new Promise((resolve) => {
      const video = document.createElement('video')
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      video.preload = 'metadata'
      video.onloadedmetadata = () => {
        canvas.width = 320
        canvas.height = 180
        
        video.currentTime = 1 // Seek to 1 second for thumbnail
      }

      video.onseeked = () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const thumbnail = canvas.toDataURL('image/jpeg', 0.8)
        resolve(thumbnail)
      }

      video.src = URL.createObjectURL(videoFile)
    })
  }

  const validateFile = (file) => {
    const errors = []
    
    if (!file.type.startsWith('video/')) {
      errors.push('File must be a video')
    }
    
    if (file.size > maxSize) {
      errors.push(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`)
    }
    
    return errors
  }

  const handleFile = useCallback(async (file) => {
    const fileErrors = validateFile(file)
    
    if (fileErrors.length > 0) {
      setError(fileErrors.join(', '))
      return
    }

    setError('')
    setUploading(true)

    try {
      // Generate thumbnail
      const thumbnail = await generateThumbnail(file)
      
      // Create video preview URL
      const preview = URL.createObjectURL(file)
      
      const videoData = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview,
        thumbnail,
        name: file.name,
        size: file.size,
        duration: null // Will be set when video loads
      }

      onChange(videoData)
    } catch (err) {
      setError('Failed to process video file')
    } finally {
      setUploading(false)
    }
  }, [maxSize, onChange])

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
      handleFile(e.dataTransfer.files[0])
    }
  }, [handleFile])

  const handleInputChange = useCallback((e) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }, [handleFile])

  const removeVideo = () => {
    if (video?.preview) {
      URL.revokeObjectURL(video.preview)
    }
    onChange(null)
    setError('')
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDuration = (seconds) => {
    if (!seconds) return '00:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-4">
      {!video ? (
        // Upload Area
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
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
            accept="video/*"
            onChange={handleInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading}
          />
          
          <div className="space-y-3">
            {uploading ? (
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  Processing Video...
                </p>
              </div>
            ) : (
              <>
                <div className="text-5xl">🎥</div>
                <div>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    Upload Video
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Drag and drop a video here, or click to select
                  </p>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  Maximum {Math.round(maxSize / 1024 / 1024)}MB • MP4, MOV, AVI supported
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        // Video Preview
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
        >
          <div className="relative">
            {/* Video Player */}
            <video
              ref={videoRef}
              src={video.preview}
              className="w-full h-64 object-cover"
              controls
              onLoadedMetadata={(e) => {
                const duration = e.target.duration
                onChange({
                  ...video,
                  duration
                })
              }}
            />
            
            {/* Remove Button */}
            <button
              onClick={removeVideo}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Video Info */}
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 dark:text-white truncate">
                  {video.name}
                </h4>
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>{formatFileSize(video.size)}</span>
                  {video.duration && (
                    <span>{formatDuration(video.duration)}</span>
                  )}
                </div>
              </div>
              <div 
                className="px-3 py-1 text-xs font-bold text-white rounded-full"
                style={{ backgroundColor: brand.secondaryColor }}
              >
                Video
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Error Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3"
          >
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden canvas for thumbnail generation */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
} 