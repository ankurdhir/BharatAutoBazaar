import React, { useState, useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useBrand } from '../contexts/BrandContext'

function AnimatedCounter({ value, duration = 0.8, prefix = '₹', suffix = '' }) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, latest => Math.round(latest))
  const brand = useBrand()

  useEffect(() => {
    const controls = animate(count, value, { duration })
    return controls.stop
  }, [value, duration, count])

  return (
    <motion.span
      style={{ color: brand.primaryColor }}
      className="text-3xl lg:text-4xl font-bold"
    >
      {prefix}<motion.span>{rounded}</motion.span>{suffix}
    </motion.span>
  )
}

export default function EMICalculator({ carPrice = 500000 }) {
  const getDefaultLoanAmount = (price) => {
    // Default to 80% of car price, but cap at 40L and minimum 50K
    return Math.max(50000, Math.min(price * 0.8, 4000000))
  }
  
  const [loanAmount, setLoanAmount] = useState(getDefaultLoanAmount(carPrice))
  const [tenure, setTenure] = useState(60) // months
  const [interestRate, setInterestRate] = useState(8.5)
  const [emi, setEmi] = useState(0)
  const brand = useBrand()

  useEffect(() => {
    if (carPrice > 0) {
      setLoanAmount(getDefaultLoanAmount(carPrice))
    }
  }, [carPrice])

  useEffect(() => {
    calculateEMI()
  }, [loanAmount, tenure, interestRate])

  const calculateEMI = () => {
    if (loanAmount && interestRate && tenure) {
      const principal = loanAmount
      const monthlyRate = interestRate / 12 / 100
      const numberOfMonths = tenure

      if (monthlyRate === 0) {
        setEmi(principal / numberOfMonths)
      } else {
        // EMI Formula: EMI = P*r*(1+r)^n/((1+r)^n-1)
        const emiValue = (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfMonths)) / 
                        (Math.pow(1 + monthlyRate, numberOfMonths) - 1)
        setEmi(emiValue)
      }
    }
  }

  const totalAmount = emi * tenure
  const totalInterest = totalAmount - loanAmount

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 lg:p-8"
    >
      <div className="text-center mb-8">
        <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          EMI Calculator
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Calculate your monthly installment
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Controls Section */}
        <div className="space-y-6">
          {/* Car Price Display */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Car Price</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                ₹{carPrice.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Loan Amount Slider */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Loan Amount
              </label>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                ₹{loanAmount.toLocaleString()}
              </span>
            </div>
            <div className="relative">
              <input
                type="range"
                min="50000"
                max="4000000"
                step="25000"
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, ${brand.primaryColor} 0%, ${brand.primaryColor} ${((loanAmount - 50000) / (4000000 - 50000)) * 100}%, #e5e7eb ${((loanAmount - 50000) / (4000000 - 50000)) * 100}%, #e5e7eb 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>₹0.5L</span>
                <span>₹40L</span>
              </div>
            </div>
          </div>

          {/* Loan Tenure Slider */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Loan Tenure
              </label>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {Math.round(tenure / 12)} years
              </span>
            </div>
            <div className="relative">
              <input
                type="range"
                min="12"
                max="84"
                step="12"
                value={tenure}
                onChange={(e) => setTenure(Number(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, ${brand.accentColor || '#06b6d4'} 0%, ${brand.accentColor || '#06b6d4'} ${((tenure - 12) / (84 - 12)) * 100}%, #e5e7eb ${((tenure - 12) / (84 - 12)) * 100}%, #e5e7eb 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>1 year</span>
                <span>7 years</span>
              </div>
            </div>
          </div>

          {/* Interest Rate Slider */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Interest Rate
              </label>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {interestRate}% p.a.
              </span>
            </div>
            <div className="relative">
              <input
                type="range"
                min="5"
                max="18"
                step="0.25"
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #f59e0b 0%, #ef4444 ${((interestRate - 5) / (18 - 5)) * 100}%, #e5e7eb ${((interestRate - 5) / (18 - 5)) * 100}%, #e5e7eb 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>5%</span>
                <span>18%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {/* Monthly EMI Display */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="text-center p-6 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600"
            style={{ 
              border: `2px solid ${brand.primaryColor}30`
            }}
          >
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Monthly EMI
            </div>
            <AnimatedCounter value={emi} />
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              for {Math.round(tenure / 12)} years
            </div>
          </motion.div>

          {/* Interest Stats */}
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 text-center">
            <div className="text-xs text-orange-600 dark:text-orange-400 mb-1">Total Interest</div>
            <div className="text-lg font-bold text-orange-700 dark:text-orange-300">
              ₹{totalInterest.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-5">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4 text-center">
              Payment Breakdown
            </h4>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Loan Amount:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  ₹{loanAmount.toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Interest ({interestRate}% p.a.):</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  ₹{totalInterest.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              
              <div className="border-t border-gray-300 dark:border-gray-600 pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900 dark:text-white">Total Amount Payable:</span>
                  <span className="font-bold text-lg text-gray-900 dark:text-white">
                    ₹{totalAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Reset Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 border-2 font-semibold rounded-lg transition-colors duration-200"
            style={{ 
              borderColor: brand.primaryColor,
              color: brand.primaryColor
            }}
            onClick={() => {
              setLoanAmount(getDefaultLoanAmount(carPrice))
              setTenure(60)
              setInterestRate(8.5)
            }}
          >
            Reset Calculator
          </motion.button>
        </div>
      </div>

      <style jsx>{`
        .slider {
          -webkit-appearance: none;
          appearance: none;
          outline: none;
        }
        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          height: 22px;
          width: 22px;
          border-radius: 50%;
          background: ${brand.primaryColor};
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          border: 2px solid white;
          transition: all 0.2s ease;
        }
        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 3px 12px rgba(0,0,0,0.4);
        }
        .slider::-moz-range-thumb {
          height: 22px;
          width: 22px;
          border-radius: 50%;
          background: ${brand.primaryColor};
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          transition: all 0.2s ease;
        }
        .slider::-moz-range-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 3px 12px rgba(0,0,0,0.4);
        }
        .slider:active::-webkit-slider-thumb {
          transform: scale(1.2);
        }
        .slider:active::-moz-range-thumb {
          transform: scale(1.2);
        }
      `}</style>
    </motion.div>
  )
} 