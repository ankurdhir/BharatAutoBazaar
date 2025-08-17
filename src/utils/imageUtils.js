/**
 * Image utilities for handling car image URLs
 * Converts relative URLs from API to absolute URLs
 */

// Get the backend base URL without the /api/v1 suffix
const getBackendBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
  return apiUrl.replace('/api/v1', '');
};

/**
 * Convert a relative image URL to an absolute URL
 * @param {string} imageUrl - Relative or absolute image URL
 * @returns {string} Absolute image URL
 */
export const getAbsoluteImageUrl = (imageUrl) => {
  if (!imageUrl) return '';
  
  // If it's already an absolute URL, return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // If it's a relative URL, prepend the backend base URL
  if (imageUrl.startsWith('/')) {
    return `${getBackendBaseUrl()}${imageUrl}`;
  }
  
  // If it doesn't start with /, add it
  return `${getBackendBaseUrl()}/${imageUrl}`;
};

/**
 * Get the best available image URL from a car image object
 * @param {Object} image - Image object with url and thumbnail properties
 * @returns {string} Absolute image URL
 */
export const getCarImageUrl = (image) => {
  if (!image) return '';
  
  // Prefer thumbnail for smaller displays, fallback to url
  const imageUrl = image.thumbnail || image.url;
  return getAbsoluteImageUrl(imageUrl);
};

/**
 * Get the main image URL for a car
 * @param {Object} car - Car object with images array
 * @param {number} index - Index of the image to get (default: 0)
 * @returns {string} Absolute image URL
 */
export const getCarMainImageUrl = (car, index = 0) => {
  if (!car?.images || !car.images.length) return '';
  
  const image = car.images[index];
  return getCarImageUrl(image);
};

/**
 * Get all image URLs for a car
 * @param {Object} car - Car object with images array
 * @returns {Array} Array of absolute image URLs
 */
export const getAllCarImageUrls = (car) => {
  if (!car?.images || !car.images.length) return [];
  
  return car.images.map(image => getCarImageUrl(image));
};

export default {
  getAbsoluteImageUrl,
  getCarImageUrl,
  getCarMainImageUrl,
  getAllCarImageUrls,
}; 