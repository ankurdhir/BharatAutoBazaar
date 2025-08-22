import { motion } from 'framer-motion'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBrand } from '../contexts/BrandContext'
import { useToast } from '../components/ui/use-toast'
import authService from '../services/authService'
import { useSearchParams } from 'react-router-dom'

export default function Login() {
  const brand = useBrand()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [step, setStep] = useState('phone') // 'phone' or 'otp'
  const [identifier, setIdentifier] = useState('') // email or phone
  const [otp, setOtp] = useState('')
  const [otpData, setOtpData] = useState(null) // Store OTP response data
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchParams] = useSearchParams()

  // Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault()
    const isEmail = /@/.test(identifier)
    if (!identifier) return setError('Enter email or phone')
    if (!isEmail && identifier.replace(/\D/g,'').length < 10) return setError('Enter a valid phone')
    if (isEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(identifier)) return setError('Enter a valid email')

    setLoading(true)
    setError('')

    // Format phone number (remove spaces, ensure 10 digits)
    const formatted = identifier.trim()

    try {
      const result = await authService.sendOTP(formatted)

      if (result.success) {
        setOtpData(result.data)
        setStep('otp')
        
        toast({
          title: "OTP Sent Successfully",
          description: `OTP has been sent.`,
        })

        // Show development hint if available
        if (result.data.dev_hint) {
          toast({
            title: "Development Mode",
            description: result.data.dev_hint,
            variant: "default",
          })
        }
      } else {
        if (result.isRateLimit) {
          setError('Too many attempts. Please try again later.')
        } else {
          setError(result.error || 'Failed to send OTP')
        }
      }
    } catch (error) {
      setError('Failed to send OTP. Please try again.')
      toast({
        title: "Network Error",
        description: "Failed to send OTP. Please check your connection.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Development quick login
  const handleDevLogin = async () => {
    const isEmail = /@/.test(identifier)
    if (!identifier) return setError('Enter email or phone')

    setLoading(true)
    setError('')

    const formatted = identifier.trim()

    try {
      const result = await authService.devLogin(formatted)

      if (result.success) {
        toast({
          title: "Development Login Successful",
          description: `Logged in as ${result.user.name || result.user.email || result.user.phone_number}`,
        })

        // Check if user came from a protected route
        const returnUrl = searchParams.get('returnUrl')
        if (returnUrl) {
          // If user came from sell, send them to seller dashboard instead of form
          if (returnUrl === '/sell') {
            navigate('/seller/dashboard')
          } else {
            navigate(returnUrl)
          }
        } else {
          navigate('/seller/dashboard')
        }
      } else {
        setError(result.error || 'Development login failed')
      }
    } catch (error) {
      setError('Development login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpSubmit = async (e) => {
    e.preventDefault()
    
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP')
      return
    }
    
    if (!otpData) {
      setError('OTP session expired. Please request a new OTP.')
      setStep('phone')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      // Keep it simple: let service normalize to E.164
      const target = identifier.trim()
      
      console.log('Verifying OTP with:', {
        otpId: otpData.otp_id,
        otp: otp,
        phone: rawPhone
      })
      
      const result = await authService.verifyOTP(otpData.otp_id, otp, target)
      
      console.log('VerifyOTP result:', result)
      
      if (result.success) {
        toast({
          title: "Login Successful",
          description: result.isNewUser 
                            ? "Welcome to Bharat Auto Bazaar! Your account has been created." 
            : `Welcome back, ${result.user.name || result.user.email || result.user.phone_number}!`,
        })

        // Check if user came from a protected route
        const returnUrl = searchParams.get('returnUrl')
        if (returnUrl) {
          if (returnUrl === '/sell') {
            navigate('/seller/dashboard')
          } else {
            navigate(returnUrl)
          }
        } else {
          navigate('/seller/dashboard')
        }
      } else {
        setError(result.error)
        
        // Show validation errors if available
        if (result.validationErrors) {
          const errors = Object.values(result.validationErrors).flat()
          if (errors.length > 0) {
            setError(errors[0])
          }
        }
      }
    } catch (error) {
      console.error('OTP verification exception:', error)
      setError('Failed to verify OTP. Please try again.')
      toast({
        title: "Verification Failed",
        description: "Failed to verify OTP. Please check your connection.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setLoading(true)
    setError('')
    
    try {
      // Normalize to E.164: keep digits, ensure +91 prefix
      const target = identifier.trim()
      const result = await authService.sendOTP(target)
      
      if (result.success) {
        setOtpData(result.data)
        setOtp('') // Clear previous OTP
        
        toast({
          title: "OTP Resent",
          description: "A new OTP has been sent to your phone.",
        })
        
        // Show demo OTP in development
        if (result.data.otp) {
          toast({
            title: "Demo OTP",
            description: `Use OTP: ${result.data.otp} for testing`,
            variant: "info",
          })
        }
      } else {
        setError(result.error)
      }
    } catch (error) {
      setError('Failed to resend OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBackToPhone = () => {
    setStep('phone')
    setOtp('')
    setOtpData(null)
    setError('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <span className="text-2xl font-bold text-white">{brand.name[0]}</span>
            </motion.div>
            
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {step === 'phone' ? 'Welcome to Bharat Auto Bazaar' : 'Verify Your Phone'}
            </h1>
            
            <p className="text-gray-600 dark:text-gray-400">
              {step === 'phone' 
                ? 'Enter your phone number to get started' 
                : `We've sent an OTP to your ${/@/.test(identifier) ? 'email' : 'phone'}`
              }
            </p>
          </div>

          {/* Phone Number Step */}
          {step === 'phone' && (
            <motion.form 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleSendOtp}
              className="space-y-6"
            >
              <div>
                <label htmlFor="id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email or Phone
                </label>
                <div className="relative">
                  <input
                    id="id"
                    type="text"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value)
                      setError('')
                    }}
                    placeholder="you@example.com or 9876543210"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                {error && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-2 text-sm text-red-600 dark:text-red-400"
                  >
                    {error}
                  </motion.p>
                )}
              </div>

              <motion.button
                type="submit"
                disabled={loading || !identifier}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Sending OTP...
                  </div>
                ) : (
                  'Send OTP'
                )}
              </motion.button>

              {/* Development Login Button */}
              {import.meta.env.DEV && (
                <motion.button
                  type="button"
                  onClick={handleDevLogin}
                  disabled={loading || !identifier}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Logging in...
                    </div>
                  ) : (
                    '🚀 Quick Dev Login (Skip OTP)'
                  )}
                </motion.button>
              )}
            </motion.form>
          )}

          {/* OTP Verification Step */}
          {step === 'otp' && (
            <motion.form 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleOtpSubmit}
              className="space-y-6"
            >
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Enter 6-digit OTP
                </label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                    setError('')
                  }}
                  placeholder="123456"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-2xl tracking-widest"
                  required
                  maxLength={6}
                  autoComplete="one-time-code"
                />
                {error && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-2 text-sm text-red-600 dark:text-red-400"
                  >
                    {error}
                  </motion.p>
                )}

                {/* Development hint */}
                {import.meta.env.DEV && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-2 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg"
                  >
                    <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                      🚀 Development Mode: Use OTP <code className="font-mono bg-green-100 dark:bg-green-800 px-1 rounded">0000</code> to bypass verification
                    </p>
                  </motion.div>
                )}
              </div>

              <motion.button
                type="submit"
                disabled={loading || otp.length < 4}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Verifying...
                  </div>
                ) : (
                  'Verify & Login'
                )}
              </motion.button>

              {/* Resend and Back options */}
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleBackToPhone}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  ← Change Number
                </button>
                
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={loading}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:opacity-50"
                >
                  Resend OTP
                </button>
              </div>
            </motion.form>
          )}

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
} 