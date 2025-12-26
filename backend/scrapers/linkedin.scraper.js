/**
 * LinkedIn Profile Scraper
 * Parses LinkedIn profile HTML to extract structured data
 */

const cheerio = require('cheerio');

class LinkedInScraper {
  /**
   * Parse LinkedIn profile HTML
   * @param {string} html - Full page HTML
   * @param {string} url - Profile URL
   * @returns {object} - Extracted profile data
   */
  static scrape(html, url) {
    const $ = cheerio.load(html);
    
    const profile = {
      platform: 'linkedin',
      url: url,
      name: '',
      headline: '',
      bio_line: '',
      location: '',
      about: '',
      follower_count: 0,
      connection_count: 0,
      scraped_at: new Date().toISOString()
    };

    try {
      // Extract name
      profile.name = this.extractName($);
      
      // Extract headline/bio line
      profile.headline = this.extractHeadline($);
      profile.bio_line = profile.headline;
      
      // Extract location
      profile.location = this.extractLocation($);
      
      // Extract about section
      profile.about = this.extractAbout($);
      
      // Extract follower count
      profile.follower_count = this.extractFollowerCount($);
      
      // Extract connection count
      profile.connection_count = this.extractConnectionCount($);

      console.log('✅ LinkedIn profile scraped successfully:', profile.name);
      return profile;
    } catch (error) {
      console.error('❌ Error scraping LinkedIn profile:', error);
      return profile;
    }
  }

  /**
   * Extract profile name
   */
  static extractName($) {
    const selectors = [
      'h1.text-heading-xlarge',
      '.pv-text-details__left-panel h1',
      'h1.inline.t-24.v-align-middle.break-words',
      '.pv-top-card--list li:first-child',
      'div.ph5 h1'
    ];

    for (const selector of selectors) {
      const text = $(selector).first().text().trim();
      if (text) return text;
    }
    return '';
  }

  /**
   * Extract headline/bio line
   */
  static extractHeadline($) {
    const selectors = [
      '.text-body-medium.break-words',
      '.pv-text-details__left-panel .text-body-medium',
      'div.text-body-medium.break-words',
      '.pv-top-card--list.pv-top-card--list-bullet.mt1 li:first-child'
    ];

    for (const selector of selectors) {
      const text = $(selector).first().text().trim();
      if (text) return text;
    }
    return '';
  }

  /**
   * Extract location
   */
  static extractLocation($) {
    const selectors = [
      '.text-body-small.inline.t-black--light.break-words',
      '.pv-text-details__left-panel .text-body-small',
      'span.text-body-small.inline.t-black--light.break-words',
      '.pv-top-card--list-bullet li'
    ];

    for (const selector of selectors) {
      const text = $(selector).first().text().trim();
      if (text && !text.toLowerCase().includes('contact info')) {
        return text;
      }
    }
    return '';
  }

  /**
   * Extract about section
   */
  static extractAbout($) {
    const selectors = [
      '#about ~ * .display-flex.ph5.pv3',
      'section[data-section="summary"] .pv-shared-text-with-see-more',
      '.pv-about-section .pv-about__summary-text',
      'div[id="about"] ~ div .inline-show-more-text'
    ];

    for (const selector of selectors) {
      const text = $(selector).first().text().trim();
      if (text) return text;
    }

    // Alternative: find "About" heading and get next content
    const aboutHeading = $('h2, h3').filter((i, el) => {
      return $(el).text().trim().toLowerCase() === 'about';
    }).first();

    if (aboutHeading.length) {
      const aboutContent = aboutHeading.parent().parent().find('.display-flex').first();
      return aboutContent.text().trim() || '';
    }

    return '';
  }

  /**
   * Extract follower count
   */
  static extractFollowerCount($) {
    const bodyText = $('body').text();
    
    // Method 1: Look for follower patterns in links
    const followerLinks = $('a[href*="facetNetwork"], a.pv-top-card--list-bullet');
    for (let i = 0; i < followerLinks.length; i++) {
      const linkText = $(followerLinks[i]).text().toLowerCase();
      if (linkText.includes('follower')) {
        const match = linkText.match(/(\d+(?:[,\.]\d+)?[KkMm]?)\s*followers?/i);
        if (match) {
          return this.parseCount(match[1]);
        }
      }
    }

    // Method 2: Search in full body text
    const followerMatch = bodyText.match(/(\d+(?:[,\.]\d+)?[KkMm]?)\s*followers?/i);
    if (followerMatch) {
      return this.parseCount(followerMatch[1]);
    }

    return 0;
  }

  /**
   * Extract connection count
   */
  static extractConnectionCount($) {
    const bodyText = $('body').text();
    
    // Method 1: Look for connection patterns in links
    const connectionLinks = $('a[href*="facetConnectionOf"], a.pv-top-card--list-bullet');
    for (let i = 0; i < connectionLinks.length; i++) {
      const linkText = $(connectionLinks[i]).text().toLowerCase();
      if (linkText.includes('connection')) {
        const match = linkText.match(/(\d+(?:[,\.]\d+)?[KkMm]?\+?)\s*connections?/i);
        if (match) {
          return this.parseCount(match[1]);
        }
      }
    }

    // Method 2: Search in full body text
    const connectionMatch = bodyText.match(/(\d+(?:[,\.]\d+)?[KkMm]?\+?)\s*connections?/i);
    if (connectionMatch) {
      return this.parseCount(connectionMatch[1]);
    }

    return 0;
  }

  /**
   * Parse count string to number
   * @param {string} text - Count text (e.g., "10K", "1.5M", "500")
   * @returns {number}
   */
  static parseCount(text) {
    if (!text) return 0;
    
    const cleanText = text.toString().toLowerCase().replace(/[^0-9.km+]/g, '');
    
    if (cleanText.includes('k')) {
      return Math.round(parseFloat(cleanText) * 1000);
    } else if (cleanText.includes('m')) {
      return Math.round(parseFloat(cleanText) * 1000000);
    }
    
    return parseInt(cleanText.replace(/[,+]/g, '')) || 0;
  }
}

module.exports = LinkedInScraper;