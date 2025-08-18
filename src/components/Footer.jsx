import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useBrand } from '../contexts/BrandContext'

export default function Footer() {
  const brand = useBrand()

  const quickLinks = [
    { name: 'Home', path: '/' },
    { name: 'Buy Car', path: '/buy' },
    { name: 'Sell Car', path: '/sell' }
  ]

  // Support section removed per request

  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <img src={brand.logo} alt={brand.name} className="h-8 w-8" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {brand.name}
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md">
              {brand.tagline}
            </p>
            <div className="flex flex-col space-y-1 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-2">
                <span>Contact:</span>
                <a 
                  href={`mailto:admin@bharatauttobazaar.com`}
                  className="hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
                  style={{ color: brand.primaryColor }}
                >
                  admin@bharatauttobazaar.com
                </a>
              </div>
              <div className="flex items-center space-x-2">
                <span>Phone:</span>
                <a 
                  href="tel:+919999800452"
                  className="hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
                  style={{ color: brand.primaryColor }}
                >
                  +91 99998 00452
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support section removed */}
        </div>

        {/* Bottom Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700"
        >
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} {brand.name}. All rights reserved.
            </div>
            
            <div className="flex space-x-6 text-sm text-gray-500 dark:text-gray-400">
              <Link to="/privacy" className="hover:text-gray-900 dark:hover:text-white transition-colors duration-200">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-gray-900 dark:hover:text-white transition-colors duration-200">
                Terms of Service
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  )
} 