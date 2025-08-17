import React from 'react'
import { motion } from 'framer-motion'

export default function ListingCard({ 
  thumbnail, 
  title, 
  price, 
  km, 
  city, 
  fuel, 
  onViewDetails 
}) {
  return (
    <motion.div
      whileHover={{ 
        scale: 1.02,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden cursor-pointer"
      onClick={onViewDetails}
    >
      {/* Image Container */}
      <div className="relative overflow-hidden">
        <img 
          src={thumbnail} 
          alt={title}
          className="w-full h-48 object-cover"
        />
        
        {/* Badge Ribbons */}
        <div className="absolute top-3 left-3">
          <span className="inline-block bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded-full mb-2">
            {km} km
          </span>
        </div>
        
        <div className="absolute top-3 right-3">
          <span className="inline-block bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
            {city}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 truncate">
          {title}
        </h3>

        {/* Price */}
        <div className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          ${price?.toLocaleString()}
        </div>

        {/* Car Details */}
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
              {fuel}
            </div>
          </div>
        </div>

        {/* View Details Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
          onClick={(e) => {
            e.stopPropagation()
            onViewDetails()
          }}
        >
          View Details
        </motion.button>
      </div>
    </motion.div>
  )
} 