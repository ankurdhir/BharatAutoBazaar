import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useBrand } from '../contexts/BrandContext'
import { useToast } from '../components/ui/use-toast'
import authService from '../services/authService'
import carService from '../services/carService'
import communicationService from '../services/communicationService'
import { getCarMainImageUrl } from '../utils/imageUtils'

export default function Dashboard() {
  const brand = useBrand()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  // Check authentication with proper initialization
  useEffect(() => {
    const checkAuthentication = () => {
      // Double check both authService state and localStorage
      const hasToken = authService.isAuthenticated() || localStorage.getItem('authToken')
      
      if (!hasToken) {
        toast({
          title: "Authentication Required",
          description: "Please login to access your dashboard",
          variant: "destructive",
        })
        // Add returnUrl parameter so user comes back to dashboard after login
        navigate('/login?returnUrl=' + encodeURIComponent('/dashboard'))
      }
    }

    // Small delay to ensure authService has fully initialized
    const timeoutId = setTimeout(checkAuthentication, 100)
    
    // Cleanup timeout on component unmount
    return () => clearTimeout(timeoutId)
  }, [navigate, toast])

  // State management
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState({})
  const [listings, setListings] = useState([])
  const [inquiries, setInquiries] = useState([])
  const [notifications, setNotifications] = useState([])
  const [activeTab, setActiveTab] = useState('overview')

  // Load dashboard data
  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Get current user
      const currentUser = authService.getCurrentUser()
      console.log('👤 Current User:', currentUser)
      console.log('🔑 Auth Token:', localStorage.getItem('authToken')?.substring(0, 50) + '...')
      
      // If we have a token but no current user, set the test user
      if (!currentUser && localStorage.getItem('authToken')) {
        const testUser = {
          id: 'e2df72a2-5b8d-42aa-86ad-45d02187c040',
          name: 'Test User',
          email: 'testuser@spinny.com'
        }
        localStorage.setItem('currentUser', JSON.stringify(testUser))
        setUser(testUser)
        console.log('🔧 Set test user for dashboard')
      } else {
        setUser(currentUser)
      }

      // Load all dashboard data in parallel
      const [userResult, statsResult, listingsResult, inquiriesResult, notificationsResult] = await Promise.all([
        authService.getUserProfile(),
        carService.getSellerStats(),
        carService.getSellerListings({ limit: 10 }),
        communicationService.getSellerInquiries({ limit: 10 }),
        communicationService.getNotifications({ limit: 5 })
      ])

      // Debug logging
      console.log('🔍 Dashboard API Debug:')
      console.log('📊 Stats Result:', statsResult)
      console.log('🚗 Listings Result:', listingsResult)
      console.log('💬 Inquiries Result:', inquiriesResult)

      if (userResult.success) setUser(userResult.user)
      if (statsResult.success) {
        console.log('✅ Setting stats:', statsResult.stats)
        setStats(statsResult.stats)
      }
      if (listingsResult.success) {
        console.log('✅ Setting listings:', listingsResult.data.cars || [])
        setListings(listingsResult.data.cars || [])
      }
      if (inquiriesResult.success) setInquiries(inquiriesResult.data.inquiries || [])
      if (notificationsResult.success) setNotifications(notificationsResult.data.notifications || [])

    } catch (error) {
      toast({
        title: "Error Loading Dashboard",
        description: "Failed to load dashboard data. Please refresh the page.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      await authService.logout()
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out",
      })
      navigate('/')
    } catch (error) {
      toast({
        title: "Logout Error",
        description: "Failed to logout properly",
        variant: "destructive",
      })
    }
  }

  // Handle listing actions
  const handleDeleteListing = async (listingId) => {
    if (!confirm('Are you sure you want to delete this listing?')) return

    try {
      const result = await carService.deleteCarListing(listingId)
      if (result.success) {
        setListings(prev => prev.filter(car => car.id !== listingId))
        toast({
          title: "Listing Deleted",
          description: "Your car listing has been deleted successfully",
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
        title: "Delete Error",
        description: "Failed to delete listing",
        variant: "destructive",
      })
    }
  }

  // Handle inquiry response
  const handleRespondToInquiry = async (inquiryId, response) => {
    try {
      const result = await communicationService.respondToInquiry(inquiryId, {
        message: response,
        available_for_call: true
      })
      
      if (result.success) {
        // Update inquiry status locally
        setInquiries(prev => prev.map(inquiry => 
          inquiry.id === inquiryId 
            ? { ...inquiry, status: 'responded', seller_response: response }
            : inquiry
        ))
        toast({
          title: "Response Sent",
          description: "Your response has been sent to the buyer",
        })
      } else {
        toast({
          title: "Response Failed",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Response Error", 
        description: "Failed to send response",
        variant: "destructive",
      })
    }
  }

  // Mark notifications as read
  const markNotificationRead = async (notificationId) => {
    try {
      await communicationService.markNotificationRead(notificationId)
      setNotifications(prev => prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, is_read: true }
          : notif
      ))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
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
                Welcome back, {user?.name || 'User'}!
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Manage your car listings and track your sales
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link to="/sell">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  + Add New Listing
                </motion.button>
              </Link>
              
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
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Listings</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.listings?.active || 0}
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
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <span className="text-2xl">💬</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Inquiries</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {inquiries.length}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', name: 'Overview', icon: '📊' },
                { id: 'listings', name: 'My Listings', icon: '🚗' },
                { id: 'inquiries', name: 'Inquiries', icon: '💬' },
                { id: 'notifications', name: 'Notifications', icon: '🔔' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Recent Activity */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Recent Activity
                </h3>
                
                {notifications.length > 0 ? (
                  <div className="space-y-4">
                    {notifications.slice(0, 5).map(notification => {
                      const formatted = communicationService.formatNotification(notification)
                      return (
                        <div 
                          key={notification.id}
                          className={`p-4 rounded-lg border ${
                            notification.is_read 
                              ? 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600' 
                              : 'bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-700'
                          }`}
                          onClick={() => !notification.is_read && markNotificationRead(notification.id)}
                        >
                          <div className="flex items-start space-x-3">
                            <span className="text-2xl">{formatted.typeIcon}</span>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 dark:text-white">
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatted.timeAgo}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Quick Actions
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link to="/sell">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      <span className="text-2xl block mb-2">➕</span>
                      <h4 className="font-medium text-gray-900 dark:text-white">Add New Listing</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">List a new car for sale</p>
                    </motion.div>
                  </Link>
                  
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setActiveTab('inquiries')}
                    className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <span className="text-2xl block mb-2">💬</span>
                    <h4 className="font-medium text-gray-900 dark:text-white">View Inquiries</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {inquiries.filter(i => i.status === 'new').length} new inquiries
                    </p>
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setActiveTab('listings')}
                    className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <span className="text-2xl block mb-2">📊</span>
                    <h4 className="font-medium text-gray-900 dark:text-white">Manage Listings</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {listings.length} active listings
                    </p>
                  </motion.div>
                </div>
              </div>
            </div>
          )}

          {/* Listings Tab */}
          {activeTab === 'listings' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    My Car Listings
                  </h3>
                  <Link to="/sell">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
                    >
                      + Add New
                    </motion.button>
                  </Link>
                </div>
              </div>

              <div className="p-6">
                {listings.length > 0 ? (
                  <div className="space-y-6">
                    {listings.map(car => (
                      <div key={car.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                        <div className="flex items-start space-x-4">
                          <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                            {car.images && car.images.length > 0 ? (
                              <img
                                src={getCarMainImageUrl(car)}
                                alt={carService.getCarDisplayName(car)}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-2xl">🚗</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {carService.getCarDisplayName(car)}
                              </h4>
                              <div className="flex items-center space-x-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  car.status === 'active' 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                    : car.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                                }`}>
                                  {car.status === 'active' ? 'Active' : 
                                   car.status === 'pending' ? 'Under Review' : 
                                   car.status === 'sold' ? 'Sold' : 'Inactive'}
                                </span>
                              </div>
                            </div>
                            
                            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                              <p>📍 {carService.getCarLocation(car)}</p>
                              <p>💰 {carService.formatPrice(car.price)}</p>
                              <p>👁️ {car.analytics?.total_views || 0} views • 💬 {car.analytics?.total_inquiries || 0} inquiries</p>
                            </div>
                            
                            <div className="mt-4 flex items-center space-x-3">
                              <Link to={`/listing/${car.id}`}>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                                >
                                  View Details
                                </motion.button>
                              </Link>
                              
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleDeleteListing(car.id)}
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                              >
                                Delete
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🚗</div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      No listings yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Create your first car listing to get started selling
                    </p>
                    <Link to="/sell">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                      >
                        Create First Listing
                      </motion.button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Inquiries Tab */}
          {activeTab === 'inquiries' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Buyer Inquiries
                </h3>
              </div>

              <div className="p-6">
                {inquiries.length > 0 ? (
                  <div className="space-y-6">
                    {inquiries.map(inquiry => {
                      const formatted = communicationService.formatInquiry(inquiry)
                      return (
                        <div key={inquiry.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {inquiry.buyer_name}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {communicationService.formatPhoneNumber(inquiry.buyer_phone)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatted.timeAgo} • {formatted.contactTimeLabel}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${formatted.statusLabel.color}`}>
                              {formatted.statusLabel.text}
                            </span>
                          </div>
                          
                          <div className="mb-4">
                            <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                              Inquiry for: {carService.getCarDisplayName(inquiry.car)}
                            </h5>
                            <p className="text-gray-700 dark:text-gray-300">
                              {inquiry.message}
                            </p>
                          </div>
                          
                          {inquiry.status === 'new' && (
                            <div className="flex items-center space-x-3">
                              <input
                                type="text"
                                placeholder="Type your response..."
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter' && e.target.value.trim()) {
                                    handleRespondToInquiry(inquiry.id, e.target.value.trim())
                                    e.target.value = ''
                                  }
                                }}
                              />
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => {
                                  const input = e.target.parentElement.querySelector('input')
                                  if (input.value.trim()) {
                                    handleRespondToInquiry(inquiry.id, input.value.trim())
                                    input.value = ''
                                  }
                                }}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                              >
                                Send
                              </motion.button>
                            </div>
                          )}
                          
                          {inquiry.seller_response && (
                            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
                              <p className="text-sm font-medium text-blue-900 dark:text-blue-200">Your Response:</p>
                              <p className="text-sm text-blue-800 dark:text-blue-300">{inquiry.seller_response}</p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">💬</div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      No inquiries yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      When buyers contact you about your cars, they'll appear here
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Notifications
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={async () => {
                      try {
                        await communicationService.markAllNotificationsRead()
                        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
                        toast({
                          title: "All Notifications Marked as Read",
                          description: "All notifications have been marked as read",
                        })
                      } catch (error) {
                        toast({
                          title: "Error",
                          description: "Failed to mark notifications as read",
                          variant: "destructive",
                        })
                      }
                    }}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                  >
                    Mark All as Read
                  </motion.button>
                </div>
              </div>

              <div className="p-6">
                {notifications.length > 0 ? (
                  <div className="space-y-4">
                    {notifications.map(notification => {
                      const formatted = communicationService.formatNotification(notification)
                      return (
                        <div 
                          key={notification.id}
                          className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                            notification.is_read 
                              ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600' 
                              : 'bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800'
                          }`}
                          onClick={() => !notification.is_read && markNotificationRead(notification.id)}
                        >
                          <div className="flex items-start space-x-3">
                            <span className="text-2xl">{formatted.typeIcon}</span>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {notification.title}
                                </p>
                                {!notification.is_read && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-2">
                                {formatted.timeAgo}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🔔</div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      No notifications
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      You're all caught up! New notifications will appear here
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
} 