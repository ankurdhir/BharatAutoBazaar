import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const filterData = {
  makes: ['Honda', 'Toyota', 'BMW', 'Tesla', 'Ford', 'Audi', 'Mercedes', 'Nissan'],
  models: ['Civic', 'Camry', '3 Series', 'Model 3', 'F-150', 'A4', 'C-Class', 'Altima'],
  years: [2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016],
  fuels: ['Gasoline', 'Hybrid', 'Electric', 'Diesel'],
  cities: ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Edmonton', 'Ottawa', 'Winnipeg', 'Halifax']
}

function FilterSection({ title, isOpen, onToggle, children }) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <button
        onClick={onToggle}
        className="w-full flex justify-between items-center py-4 px-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
      >
        <span className="font-medium text-gray-900 dark:text-white">{title}</span>
        <motion.svg
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-5 h-5 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function CheckboxFilter({ options, selected, onChange }) {
  return (
    <div className="space-y-2 max-h-48 overflow-y-auto">
      {options.map((option) => (
        <label key={option} className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={selected.includes(option)}
            onChange={(e) => {
              if (e.target.checked) {
                onChange([...selected, option])
              } else {
                onChange(selected.filter(item => item !== option))
              }
            }}
            className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">{option}</span>
        </label>
      ))}
    </div>
  )
}

function PriceRangeSlider({ min, max, value, onChange }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>${min.toLocaleString()}</span>
        <span>${max.toLocaleString()}</span>
      </div>
      
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={value[0]}
          onChange={(e) => onChange([parseInt(e.target.value), value[1]])}
          className="absolute w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={value[1]}
          onChange={(e) => onChange([value[0], parseInt(e.target.value)])}
          className="absolute w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>
      
      <div className="flex justify-between text-sm font-medium text-gray-900 dark:text-white">
        <span>${value[0].toLocaleString()}</span>
        <span>${value[1].toLocaleString()}</span>
      </div>
    </div>
  )
}

export default function FiltersPanel({ 
  isOpen, 
  onClose, 
  isMobile = false,
  filters,
  onFiltersChange 
}) {
  const [openSections, setOpenSections] = useState({
    make: true,
    model: false,
    year: false,
    fuel: false,
    price: false,
    city: false
  })

  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const updateFilter = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const clearAllFilters = () => {
    onFiltersChange({
      makes: [],
      models: [],
      years: [],
      fuels: [],
      priceRange: [0, 100000],
      cities: []
    })
  }

  const panelContent = (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={clearAllFilters}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Clear All
          </button>
          {isMobile && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Filters Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Make */}
        <FilterSection
          title="Make"
          isOpen={openSections.make}
          onToggle={() => toggleSection('make')}
        >
          <CheckboxFilter
            options={filterData.makes}
            selected={filters.makes}
            onChange={(value) => updateFilter('makes', value)}
          />
        </FilterSection>

        {/* Model */}
        <FilterSection
          title="Model"
          isOpen={openSections.model}
          onToggle={() => toggleSection('model')}
        >
          <CheckboxFilter
            options={filterData.models}
            selected={filters.models}
            onChange={(value) => updateFilter('models', value)}
          />
        </FilterSection>

        {/* Year */}
        <FilterSection
          title="Year"
          isOpen={openSections.year}
          onToggle={() => toggleSection('year')}
        >
          <CheckboxFilter
            options={filterData.years}
            selected={filters.years}
            onChange={(value) => updateFilter('years', value)}
          />
        </FilterSection>

        {/* Fuel Type */}
        <FilterSection
          title="Fuel Type"
          isOpen={openSections.fuel}
          onToggle={() => toggleSection('fuel')}
        >
          <CheckboxFilter
            options={filterData.fuels}
            selected={filters.fuels}
            onChange={(value) => updateFilter('fuels', value)}
          />
        </FilterSection>

        {/* Price Range */}
        <FilterSection
          title="Price Range"
          isOpen={openSections.price}
          onToggle={() => toggleSection('price')}
        >
          <PriceRangeSlider
            min={0}
            max={100000}
            value={filters.priceRange}
            onChange={(value) => updateFilter('priceRange', value)}
          />
        </FilterSection>

        {/* City */}
        <FilterSection
          title="City"
          isOpen={openSections.city}
          onToggle={() => toggleSection('city')}
        >
          <CheckboxFilter
            options={filterData.cities}
            selected={filters.cities}
            onChange={(value) => updateFilter('cities', value)}
          />
        </FilterSection>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <>
        {/* Mobile Backdrop */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            />
          )}
        </AnimatePresence>

        {/* Mobile Drawer */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-80 bg-white dark:bg-gray-900 shadow-xl z-50 lg:hidden"
            >
              {panelContent}
            </motion.div>
          )}
        </AnimatePresence>
      </>
    )
  }

  // Desktop Panel
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 320, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="hidden lg:block bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          {panelContent}
        </motion.div>
      )}
    </AnimatePresence>
  )
} 