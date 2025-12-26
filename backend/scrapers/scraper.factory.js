/**
 * Scraper Factory
 * Routes HTML to the appropriate platform scraper
 */

const LinkedInScraper = require('./linkedin.scraper');
const InstagramScraper = require('./instagram.scraper');
const PlatformDetector = require('../utils/platform.detector');

class ScraperFactory {
  /**
   * Get the appropriate scraper for a platform
   * @param {string} platform - Platform name
   * @returns {object} - Scraper class
   */
  static getScraper(platform) {
    const scrapers = {
      linkedin: LinkedInScraper,
      instagram: InstagramScraper
    };

    const scraper = scrapers[platform];
    
    if (!scraper) {
      throw new Error(`No scraper available for platform: ${platform}`);
    }

    return scraper;
  }

  /**
   * Scrape profile based on URL and HTML
   * @param {string} url - Profile URL
   * @param {string} html - Page HTML
   * @returns {object} - Scraped profile data
   */
  static scrapeProfile(url, html) {
    // Detect platform from URL
    const platform = PlatformDetector.detect(url);
    
    if (!platform) {
      throw new Error('Unsupported platform or invalid URL');
    }

    console.log(`🔍 Detected platform: ${platform}`);
    console.log(`📄 HTML length: ${html.length} characters`);

    // Get the appropriate scraper
    const Scraper = this.getScraper(platform);

    // Execute scraping
    const profileData = Scraper.scrape(html, url);

    // Add metadata
    profileData.platform = platform;
    profileData.url = url;

    return profileData;
  }

  /**
   * Validate scraping request
   * @param {string} url - Profile URL
   * @param {string} html - Page HTML
   * @returns {object} - Validation result
   */
  static validate(url, html) {
    const errors = [];

    // Validate URL
    if (!url || typeof url !== 'string') {
      errors.push('URL is required and must be a string');
    }

    // Validate HTML
    if (!html || typeof html !== 'string') {
      errors.push('HTML is required and must be a string');
    }

    if (html && html.length < 100) {
      errors.push('HTML seems too short to be a valid page');
    }

    // Check if platform is supported
    if (url && !PlatformDetector.isSupported(url)) {
      errors.push(`Unsupported URL. Supported platforms: ${PlatformDetector.getSupportedPlatforms().join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Get supported platforms
   * @returns {string[]}
   */
  static getSupportedPlatforms() {
    return PlatformDetector.getSupportedPlatforms();
  }
}

module.exports = ScraperFactory;