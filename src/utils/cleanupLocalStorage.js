/**
 * Cleanup corrupted localStorage data
 * Run this in browser console if you encounter JSON parse errors
 */

export function cleanupLocalStorage() {
  try {
    const keys = ['authToken', 'refreshToken', 'currentUser'];
    let cleaned = 0;
    
    keys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value === 'undefined' || value === 'null' || value === '') {
        localStorage.removeItem(key);
        cleaned++;
        console.log(`Cleaned corrupted key: ${key}`);
      }
    });
    
    if (cleaned > 0) {
      console.log(`✅ localStorage cleanup completed. Cleaned ${cleaned} keys.`);
      console.log('🔄 Please refresh the page to continue.');
    } else {
      console.log('✅ localStorage is clean, no cleanup needed.');
    }
    
    return cleaned;
  } catch (error) {
    console.error('❌ Failed to cleanup localStorage:', error);
    return -1;
  }
}

// Auto-cleanup on import in development
if (import.meta.env.DEV) {
  cleanupLocalStorage();
}

export default cleanupLocalStorage; 