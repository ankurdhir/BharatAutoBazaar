import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useBrand } from '../contexts/BrandContext'
import StatusBadge from './StatusBadge'
import ConfirmModal from './ConfirmModal'
import { useToast } from './ui/use-toast'
import carService from '../services/carService'
import authService from '../services/authService'
import { getCarMainImageUrl } from '../utils/imageUtils'

export default function AdminDashboard() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionModal, setActionModal] = useState({ isOpen: false, listing: null, action: null })
  const [editModal, setEditModal] = useState({ isOpen: false, listingId: null, detail: null, saving: false })
  const [adminUser, setAdminUser] = useState(null)
  const [stats, setStats] = useState({})
  const [processing, setProcessing] = useState(false)
  const [filterStatus, setFilterStatus] = useState('pending')
  const brand = useBrand()
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    // Check admin authentication
    const adminToken = localStorage.getItem('adminToken')
    const adminUserData = localStorage.getItem('adminUser')
    
    if (!adminToken || !adminUserData) {
      navigate('/admin/login')
      return
    }

    setAdminUser(JSON.parse(adminUserData))
    loadDashboardData()
  }, [navigate])

  // Reload listings whenever filterStatus changes
  useEffect(() => {
    loadDashboardData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Load listings for current filter
      const [listingsResult, statsResult] = await Promise.all([
        carService.getAdminListings({ status: filterStatus }),
        carService.getAdminStats()
      ])

      if (listingsResult.success) {
        setListings(listingsResult.data.cars || [])
      } else {
        toast({
          title: "Error Loading Listings",
          description: listingsResult.error,
          variant: "destructive",
        })
      }

      if (statsResult.success) {
        setStats(statsResult.stats)
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

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    navigate('/admin/login')
  }

  const handleAction = (listing, action) => {
    setActionModal({ isOpen: true, listing, action })
  }

  const confirmAction = async () => {
    if (!actionModal.listing || !actionModal.action) return

    setProcessing(true)
    try {
      const listingId = actionModal.listing.id
      const action = actionModal.action
      let result

      if (action === 'approve') {
        result = await carService.adminApproveListing(listingId)
      } else if (action === 'reject') {
        result = await carService.adminRejectListing(listingId, {
          reason: 'Listing does not meet our quality standards'
        })
      }

      if (result && result.success) {
        // Update local state
        setListings(prev => prev.map(listing => 
          listing.id === listingId 
            ? { ...listing, status: action === 'approve' ? 'approved' : 'rejected' }
            : listing
        ))
        
        toast({
          title: `Listing ${action === 'approve' ? 'Approved' : 'Rejected'}`,
          description: `${actionModal.listing.brand} ${actionModal.listing.car_model} has been ${action}d`,
        })

        // Send notification to seller if needed
        if (action === 'approve') {
          await notifySeller(actionModal.listing, 'approved')
        } else {
          await notifySeller(actionModal.listing, 'rejected')
        }
      } else {
        toast({
          title: "Action Failed",
          description: result?.error || "Failed to process listing action",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Network Error",
        description: "Failed to process listing action",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
      setActionModal({ isOpen: false, listing: null, action: null })
    }
  }

  const notifySeller = async (listing, status) => {
    try {
      // This would call a notification service to inform the seller
      // await communicationService.sendSellerNotification(listing.seller.id, {
      //   type: status === 'approved' ? 'listing_approved' : 'listing_rejected',
      //   listing_id: listing.id,
      //   message: `Your ${listing.brand} ${listing.car_model} listing has been ${status}`
      // })
    } catch (error) {
      console.error('Failed to notify seller:', error)
    }
  }

  // Close edit modal on Escape
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && editModal.isOpen) {
        setEditModal({ isOpen: false, listingId: null, detail: null, saving: false })
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [editModal.isOpen])

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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading admin dashboard...</p>
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
                Admin Dashboard
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Welcome back, {adminUser?.name || 'Admin'}
              </p>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Logout
            </motion.button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 cursor-pointer"
            onClick={() => setFilterStatus('pending')}
            role="button"
            tabIndex={0}
          >
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <span className="text-2xl">📋</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Reviews</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.pending_listings || 0}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 cursor-pointer"
            onClick={() => setFilterStatus('approved')}
          >
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <span className="text-2xl">🚗</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Active</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.total_active || 0}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Listings Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {filterStatus === 'approved' ? 'Active Listings' : 'Pending Listings'} ({listings.length})
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
          </div>

          {listings.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Pending Listings
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                All listings have been reviewed. Great job!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Car Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Seller
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {listings.map((listing) => (
                    <tr key={listing.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer" onClick={async () => {
                      const res = await carService.getAdminCarDetail(listing.id)
                      if (res.success) {
                        setEditModal({ isOpen: true, listingId: listing.id, detail: res.data, saving: false })
                      } else {
                        toast({ title: 'Failed to load listing', description: res.error, variant: 'destructive' })
                      }
                    }}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-16 w-24 bg-gray-200 dark:bg-gray-600 rounded-lg overflow-hidden">
                            {listing.images && listing.images.length > 0 ? (
                              <img
                                src={listing.images[0].thumbnail || listing.images[0].url}
                                alt={`${listing.brand} ${listing.car_model}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-xl">🚗</span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {listing.year} {listing.brand} {listing.car_model}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {listing.fuel_type} • {listing.transmission} • {listing.km_driven?.toLocaleString()} km
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {listing.seller_info?.name || listing.seller?.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {listing.seller_info?.phone || listing.seller?.phone_number || 'No phone'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          ₹{listing.price?.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(listing.status)}`}>
                          {listing.status?.charAt(0).toUpperCase() + listing.status?.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(listing.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {listing.status === 'pending' && (
                            <>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => { e.stopPropagation(); handleAction(listing, 'approve') }}
                                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                              >
                                Approve
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => { e.stopPropagation(); handleAction(listing, 'reject') }}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                              >
                                Reject
                              </motion.button>
                            </>
                          )}
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={async (e) => {
                              e.stopPropagation()
                              if (!window.confirm('Delete this listing?')) return
                              const res = await carService.adminDeleteListing(listing.id)
                              if (res.success) {
                                setListings(prev => prev.filter(l => l.id !== listing.id))
                                toast({ title: 'Listing deleted' })
                              } else {
                                toast({ title: 'Delete failed', description: res.error, variant: 'destructive' })
                              }
                            }}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                          >
                            Delete
                          </motion.button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal({ isOpen: false, listing: null, action: null })}
        onConfirm={confirmAction}
        title={`${actionModal.action === 'approve' ? 'Approve' : 'Reject'} Listing`}
        message={`Are you sure you want to ${actionModal.action} this listing: ${actionModal.listing?.brand} ${actionModal.listing?.car_model}?`}
        confirmText={actionModal.action === 'approve' ? 'Approve' : 'Reject'}
        confirmButtonClass={actionModal.action === 'approve' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}
        processing={processing}
      />

      {editModal.isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 overflow-y-auto"
          onClick={() => setEditModal({ isOpen: false, listingId: null, detail: null, saving: false })}
        >
          <div
            className="mx-auto my-8 sm:max-w-3xl w-[calc(100%-2rem)] bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Listing</h3>
              <button onClick={() => setEditModal({ isOpen: false, listingId: null, detail: null, saving: false })} className="text-gray-500 hover:text-gray-700" aria-label="Close">✕</button>
            </div>
            {editModal.detail ? (
              <form onSubmit={async (e) => {
                e.preventDefault()
                setEditModal(prev => ({ ...prev, saving: true }))
                const formData = new FormData(e.currentTarget)
                const raw = Object.fromEntries(formData.entries())
                // Coerce numbers and booleans where needed
                const payload = {
                  ...raw,
                  price: raw.price ? Number(raw.price) : undefined,
                  year: raw.year ? Number(raw.year) : undefined,
                  km_driven: raw.km_driven ? Number(raw.km_driven) : undefined,
                }
                const res = await carService.adminUpdateListing(editModal.listingId, payload)
                if (res.success) {
                  toast({ title: 'Listing updated' })
                  setEditModal({ isOpen: false, listingId: null, detail: null, saving: false })
                  loadDashboardData()
                } else {
                  toast({ title: 'Update failed', description: res.error, variant: 'destructive' })
                  setEditModal(prev => ({ ...prev, saving: false }))
                }
              }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Title</span>
                    <input name="title" defaultValue={editModal.detail.title} className="mt-1 w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-gray-900 dark:text-white" />
                  </label>
                  <label className="block">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Price</span>
                    <input name="price" type="number" defaultValue={editModal.detail.price} className="mt-1 w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-gray-900 dark:text-white" />
                  </label>
                  <label className="block">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Brand</span>
                    <input name="brand_name" defaultValue={editModal.detail.brand} className="mt-1 w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-gray-900 dark:text-white" />
                  </label>
                  <label className="block">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Model</span>
                    <input name="model_name" defaultValue={editModal.detail.car_model} className="mt-1 w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-gray-900 dark:text-white" />
                  </label>
                  <label className="block">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Variant</span>
                    <input name="variant_name" defaultValue={editModal.detail.variant || ''} className="mt-1 w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-gray-900 dark:text-white" />
                  </label>
                  <label className="block">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Year</span>
                    <input name="year" type="number" defaultValue={editModal.detail.year} className="mt-1 w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-gray-900 dark:text-white" />
                  </label>
                  <label className="block">
                    <span className="text-sm text-gray-700 dark:text-gray-300">KM Driven</span>
                    <input name="km_driven" type="number" defaultValue={editModal.detail.km_driven} className="mt-1 w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-gray-900 dark:text-white" />
                  </label>
                  <label className="block">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Number of Owners</span>
                    <select name="owner_number" defaultValue={editModal.detail.owner_number} className="mt-1 w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-gray-900 dark:text-white">
                      {(editModal.detail.choices?.owner_number || [editModal.detail.owner_number]).map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Fuel Type</span>
                    <select name="fuel_type" defaultValue={editModal.detail.fuel_type} className="mt-1 w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-gray-900 dark:text-white">
                      {(editModal.detail.choices?.fuel_type || [editModal.detail.fuel_type]).map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Transmission</span>
                    <select name="transmission" defaultValue={editModal.detail.transmission} className="mt-1 w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-gray-900 dark:text-white">
                      {(editModal.detail.choices?.transmission || [editModal.detail.transmission]).map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Urgency</span>
                    <select name="urgency" defaultValue={editModal.detail.urgency} className="mt-1 w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-gray-900 dark:text-white">
                      {(editModal.detail.choices?.urgency || [editModal.detail.urgency]).map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm text-gray-700 dark:text-gray-300">City</span>
                    <input name="city_name" defaultValue={editModal.detail.city} className="mt-1 w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-gray-900 dark:text-white" />
                  </label>
                  <label className="block">
                    <span className="text-sm text-gray-700 dark:text-gray-300">State</span>
                    <input name="state_name" defaultValue={editModal.detail.location?.state || ''} className="mt-1 w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-gray-900 dark:text-white" />
                  </label>
                  <label className="block md:col-span-2">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Full Address</span>
                    <input name="address" defaultValue={editModal.detail.address || ''} className="mt-1 w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-gray-900 dark:text-white" />
                  </label>
                  <label className="block md:col-span-2">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Video URL (YouTube)</span>
                    <input
                      name="video_url"
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      defaultValue={editModal.detail.video_url || ''}
                      className="mt-1 w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-gray-900 dark:text-white"
                    />
                    <span className="text-xs text-gray-500">Optional. Paste a YouTube link to show on the listing page.</span>
                  </label>
                  <label className="block">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Exterior Condition</span>
                    <select name="exterior_condition" defaultValue={editModal.detail.exterior_condition} className="mt-1 w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-gray-900 dark:text-white">
                      {(editModal.detail.choices?.condition || [editModal.detail.exterior_condition]).map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Interior Condition</span>
                    <select name="interior_condition" defaultValue={editModal.detail.interior_condition} className="mt-1 w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-gray-900 dark:text-white">
                      {(editModal.detail.choices?.condition || [editModal.detail.interior_condition]).map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Engine Condition</span>
                    <select name="engine_condition" defaultValue={editModal.detail.engine_condition} className="mt-1 w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-gray-900 dark:text-white">
                      {(editModal.detail.choices?.condition || [editModal.detail.engine_condition]).map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Status</span>
                    <select name="status" defaultValue={editModal.detail.status} className="mt-1 w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-gray-900 dark:text-white">
                      {(editModal.detail.choices?.status || [editModal.detail.status]).map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block md:col-span-2">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Seller Name</span>
                    <input name="seller_name" defaultValue={editModal.detail.seller_info?.name || ''} className="mt-1 w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-gray-900 dark:text-white" />
                  </label>
                  <label className="block">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Seller Phone</span>
                    <input name="seller_phone" defaultValue={editModal.detail.seller_info?.phone || ''} className="mt-1 w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-gray-900 dark:text-white" />
                  </label>
                  <label className="block">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Seller Email</span>
                    <input name="seller_email" defaultValue={editModal.detail.seller_info?.email || ''} className="mt-1 w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-gray-900 dark:text-white" />
                  </label>
                </div>
                <label className="block">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Description</span>
                  <textarea name="description" defaultValue={editModal.detail.description} rows={4} className="mt-1 w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-gray-900 dark:text-white" />
                </label>
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">Images</h4>
                  <div className="flex flex-wrap gap-3 mb-4">
                    {(editModal.detail.images || []).map(img => (
                      <div key={img.id} className="relative w-28 h-20 rounded overflow-hidden bg-gray-200 dark:bg-gray-700">
                        {img.url ? (
                          <img src={img.url} alt="car" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">No image</div>
                        )}
                        <button
                          type="button"
                          onClick={async () => {
                            const res = await carService.adminDeleteFile(img.id)
                            if (res.success) {
                              setEditModal(prev => ({ ...prev, detail: { ...prev.detail, images: prev.detail.images.filter(i => i.id !== img.id) } }))
                            } else {
                              toast({ title: 'Delete failed', description: res.error, variant: 'destructive' })
                            }
                          }}
                          className="absolute top-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded"
                          aria-label="Remove"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input type="file" multiple accept="image/*" className="hidden" onChange={async (e) => {
                      const files = Array.from(e.target.files || [])
                      if (files.length === 0) return
                      const res = await carService.adminUploadImages(editModal.listingId, files)
                      if (res.success) {
                        const newImgs = (res.data.images || []).map(x => ({ id: x.id, url: x.url, thumbnail: x.thumbnail }))
                        setEditModal(prev => ({ ...prev, detail: { ...prev.detail, images: [...(prev.detail.images || []), ...newImgs] } }))
                        e.target.value = ''
                      } else {
                        toast({ title: 'Upload failed', description: res.error, variant: 'destructive' })
                      }
                    }} />
                    <span className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm">Add Photos</span>
                    <span className="text-xs text-gray-500">JPEG/PNG, up to 10 images</span>
                  </label>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">Preview</h4>
                  <div className="flex items-center gap-3">
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded flex-1">
                      <div className="text-lg font-bold">{editModal.detail.year} {editModal.detail.brand} {editModal.detail.car_model}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{editModal.detail.city}</div>
                      <div className="mt-2">₹{Number(editModal.detail.price || 0).toLocaleString()}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{editModal.detail.fuel_type} • {editModal.detail.transmission} • {Number(editModal.detail.km_driven || 0).toLocaleString()} km</div>
                    </div>
                    <span />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setEditModal({ isOpen: false, listingId: null, detail: null, saving: false })} className="px-4 py-2 rounded border">Cancel</button>
                  <button type="submit" disabled={editModal.saving} className="px-4 py-2 rounded text-white bg-blue-600 disabled:opacity-50">{editModal.saving ? 'Saving...' : 'Save Changes'}</button>
                </div>
              </form>
            ) : (
              <div className="text-gray-600">Loading...</div>
            )}
          </div>
        </div>
      )}


    </div>
  )
} 