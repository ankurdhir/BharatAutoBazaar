/**
 * Clear all authentication tokens from localStorage
 * Use this to fix 401 errors on public pages
 */
export const clearAllTokens = () => {
  const tokenKeys = [
    'authToken',
    'refreshToken', 
    'currentUser',
    'adminToken',
    'adminUser'
  ];
  
  let cleared = [];
  
  tokenKeys.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      cleared.push(key);
    }
  });
  
  if (cleared.length > 0) {
    console.log('🧹 Cleared tokens:', cleared);
    return true;
  }
  
  console.log('✅ No tokens to clear');
  return false;
};

// Auto-clear invalid tokens if this script is run directly
if (typeof window !== 'undefined') {
  // Check if we're on a public page with 401 errors
  const isPublicPage = window.location.pathname === '/buy' || 
                      window.location.pathname === '/' ||
                      window.location.pathname.startsWith('/listing/');
  
  if (isPublicPage) {
    clearAllTokens();
  }
} 