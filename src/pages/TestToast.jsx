import React from 'react'
import { motion } from 'framer-motion'
import { useToast } from '../components/ui/use-toast'
import { useBrand } from '../contexts/BrandContext'

export default function TestToast() {
  const { toast } = useToast()
  const brand = useBrand()

  const showSuccessToast = () => {
    toast({
      title: "Success!",
      description: "This is a success notification.",
      variant: "success",
    })
  }

  const showErrorToast = () => {
    toast({
      title: "Error",
      description: "Something went wrong. Please try again.",
      variant: "destructive",
    })
  }

  const showDefaultToast = () => {
    toast({
      title: "Information",
      description: "This is a default notification.",
      variant: "default",
    })
  }

  const showListingSubmittedToast = () => {
    toast({
      title: "Listing Submitted",
      description: "Listing submitted, pending approval. You'll receive an email confirmation shortly.",
      variant: "success",
    })
  }

  const showListingApprovedToast = () => {
    toast({
      title: "Listing Approved",
      description: "2022 Honda Civic has been approved. Seller has been notified via email.",
      variant: "success",
    })
  }

  const showListingRejectedToast = () => {
    toast({
      title: "Listing Rejected",
      description: "2022 Honda Civic has been rejected. Seller has been notified via email.",
      variant: "default",
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Toast Notification Test
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Basic Toast Tests */}
            <motion.button
              onClick={showSuccessToast}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors duration-200"
            >
              Success Toast
            </motion.button>

            <motion.button
              onClick={showErrorToast}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors duration-200"
            >
              Error Toast
            </motion.button>

            <motion.button
              onClick={showDefaultToast}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors duration-200"
            >
              Default Toast
            </motion.button>

            {/* Listing Workflow Tests */}
            <motion.button
              onClick={showListingSubmittedToast}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ backgroundColor: brand.primaryColor }}
              className="px-6 py-3 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200"
            >
              Listing Submitted
            </motion.button>

            <motion.button
              onClick={showListingApprovedToast}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ backgroundColor: brand.secondaryColor }}
              className="px-6 py-3 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200"
            >
              Admin Approved
            </motion.button>

            <motion.button
              onClick={showListingRejectedToast}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors duration-200"
            >
              Admin Rejected
            </motion.button>
          </div>

          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
              Toast Implementation
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              These notifications simulate the email notification stubs throughout the application:
            </p>
            <ul className="list-disc list-inside text-sm text-blue-700 dark:text-blue-400 mt-2 space-y-1">
              <li>Seller submission confirmations</li>
              <li>Admin approval notifications</li>
              <li>Admin rejection notifications</li>
              <li>Error handling</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  )
} 