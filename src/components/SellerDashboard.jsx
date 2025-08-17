import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBrand } from '../contexts/BrandContext'
import authService from '../services/authService'
import carService from '../services/carService'
import StatusBadge from './StatusBadge'
import ConfirmModal from './ConfirmModal'
import ListingForm from './ListingForm'
import { useToast } from './ui/use-toast'
import { getCarMainImageUrl } from '../utils/imageUtils'

// Listing Card Component
const ListingCard = ({ listing, onEdit, onDelete }) => {
  const brand = useBrand()

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
    >
      {/* Image */}
      <div className="h-48 bg-gray-200 dark:bg-gray-700 overflow-hidden">
        {listing.images && listing.images.length > 0 ? (
          <img
            src={getCarMainImageUrl(listing)}
            alt={carService.getCarDisplayName(listing)}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl">🚗</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {carService.getCarDisplayName(listing)}
            </h3>
            <p className="text-2xl font-bold" style={{ color: brand.primaryColor }}>
              {carService.formatPrice(listing.price)}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(listing.status)}`}>
            {listing.status?.charAt(0).toUpperCase() + listing.status?.slice(1)}
          </span>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
          <div>
            <span className="font-medium">Year:</span> {listing.year}
          </div>
          <div>
            <span className="font-medium">Fuel:</span> {listing.fuel_type}
          </div>
          <div>
            <span className="font-medium">KM:</span> {listing.km_driven?.toLocaleString()}
          </div>
          <div>
            <span className="font-medium">Transmission:</span> {listing.transmission}
          </div>
        </div>

        {/* Location */}
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          📍 {carService.getCarLocation(listing)}
        </div>

        {/* Dates */}
        <div className="text-xs text-gray-500 mb-4">
          <div>Created: {formatDate(listing.created_at)}</div>
          {listing.updated_at !== listing.created_at && (
            <div>Updated: {formatDate(listing.updated_at)}</div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onEdit(listing)}
            className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            Edit
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onDelete(listing)}
            className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
          >
            Delete
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

export default function SellerDashboard() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, listing: null })
  const [editingListing, setEditingListing] = useState(null)
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState({})
  const [deleting, setDeleting] = useState(false)
  const brand = useBrand()
  const { toast } = useToast()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Get user data
      const userData = authService.getCurrentUser()
      setUser(userData)

      // Load seller listings and stats in parallel
      const [listingsResult, statsResult] = await Promise.all([
        carService.getSellerListings({ limit: 50 }),
        carService.getSellerStats()
      ])

      // Debug logging for SellerDashboard
      console.log('🔍 SellerDashboard API Debug:')
      console.log('📊 Stats Result:', statsResult)
      console.log('🚗 Listings Result:', listingsResult)

      if (listingsResult.success) {
        console.log('✅ Setting listings:', listingsResult.data.cars || [])
        setListings(listingsResult.data.cars || [])
      } else {
        console.log('❌ Listings failed:', listingsResult.error)
        toast({
          title: "Error Loading Listings",
          description: listingsResult.error,
          variant: "destructive",
        })
      }

      if (statsResult.success) {
        console.log('✅ Setting stats:', statsResult.stats)
        setStats(statsResult.stats)
      } else {
        console.log('❌ Stats failed:', statsResult.error)
      }
    } catch (error) {
      toast({
        title: "Network Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (listing) => {
    setEditingListing(listing)
  }

  const handleDelete = (listing) => {
    setDeleteModal({ isOpen: true, listing })
  }

  const confirmDelete = async () => {
    if (!deleteModal.listing) return

    setDeleting(true)
    try {
      const result = await carService.deleteCarListing(deleteModal.listing.id)
      
      if (result.success) {
        setListings(prev => prev.filter(l => l.id !== deleteModal.listing.id))
        setDeleteModal({ isOpen: false, listing: null })
        
        toast({
          title: "Listing Deleted",
          description: `${carService.getCarDisplayName(deleteModal.listing)} has been removed from your listings.`,
        })
      } else {
        toast({
          title: "Delete Failed",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Network Error",
        description: "Failed to delete listing",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleEditSubmit = async (updatedData) => {
    if (!editingListing) return

    try {
      const result = await carService.updateCarListing(editingListing.id, updatedData)
      
      if (result.success) {
        // Update the listing in local state
        setListings(prev => prev.map(listing => 
          listing.id === editingListing.id 
            ? { ...listing, ...result.car, status: 'pending' }
            : listing
        ))
        setEditingListing(null)
        
        toast({
          title: "Listing Updated",
          description: "Your car listing has been updated and is under review.",
        })
      } else {
        toast({
          title: "Update Failed",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Network Error",
        description: "Failed to update listing",
        variant: "destructive",
      })
    }
  }

  const getStatusCounts = () => {
    const counts = listings.reduce((acc, listing) => {
      const status = listing.status || 'unknown'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})
    return counts
  }

  // Show edit form
  if (editingListing) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <button
              onClick={() => setEditingListing(null)}
              className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              ← Back to Dashboard
            </button>
          </div>
          
          <ListingForm
            mode="edit"
            initialData={editingListing}
            onSubmit={handleEditSubmit}
            onCancel={() => setEditingListing(null)}
          />
        </div>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your listings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                My Car Listings
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Welcome back, {user?.name || 'Seller'}!
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <span className="text-2xl">🚗</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Listings</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.listings?.total || listings.length}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <span className="text-2xl">⏳</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {getStatusCounts().pending || 0}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Approved</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {getStatusCounts().approved || 0}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <span className="text-2xl">👁️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Views</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {listings.reduce((total, listing) => total + (listing.views_count || 0), 0)}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Listings Grid */}
        {listings.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Your Listings ({listings.length})
              </h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={loadDashboardData}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Refresh
              </motion.button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {listings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-6">🚗</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              No listings yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
                              Create your first car listing to get started selling on Bharat Auto Bazaar.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.href = '/sell'}
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Create First Listing
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, listing: null })}
        onConfirm={confirmDelete}
        title="Delete Listing"
        message={`Are you sure you want to delete "${deleteModal.listing ? carService.getCarDisplayName(deleteModal.listing) : ''}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="bg-red-500 hover:bg-red-600"
        processing={deleting}
      />
    </div>
  )
} 