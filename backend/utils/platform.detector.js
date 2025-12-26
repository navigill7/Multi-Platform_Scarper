
const PLATFORM_PATTERNS = {
    linkedin: /linkedin\.com\/in\//i,
    instagram: /instagram\.com\/[^/]+\/?$/i
  };
  
  class PlatformDetector {
    /**
     * Detect platform from URL
     * @param {string} url 
     * @returns {string|null}
     */
    static detect(url) {
      if (!url || typeof url !== 'string') {
        return null;
      }
  
      // Check LinkedIn
      if (PLATFORM_PATTERNS.linkedin.test(url)) {
        return 'linkedin';
      }
  
      // Check Instagram
      if (PLATFORM_PATTERNS.instagram.test(url)) {
        return 'instagram';
      }
  
      return null;
    }
  
    /**
     * Validate if URL is supported
     * @param {string} url - The profile URL
     * @returns {boolean}
     */
    static isSupported(url) {
      return this.detect(url) !== null;
    }
  
    /**
     * Get all supported platforms
     * @returns {string[]}
     */
    static getSupportedPlatforms() {
      return Object.keys(PLATFORM_PATTERNS);
    }
  
    /**
     * Extract username from URL
     * @param {string} url - The profile URL
     * @param {string} platform - The platform name
     * @returns {string|null}
     */
    static extractUsername(url, platform) {
      try {
        const urlObj = new URL(url);
        
        if (platform === 'linkedin') {
          const match = url.match(/linkedin\.com\/in\/([^/?]+)/i);
          return match ? match[1] : null;
        }
        
        if (platform === 'instagram') {
          const match = url.match(/instagram\.com\/([^/?]+)/i);
          return match ? match[1] : null;
        }
        
        return null;
      } catch (error) {
        console.error('Error extracting username:', error);
        return null;
      }
    }
  }
  
  module.exports = PlatformDetector;