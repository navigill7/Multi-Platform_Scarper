/**
 * LinkedIn Profile Scraper (FIXED VERSION)
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
      console.log('🔍 Starting LinkedIn scrape...');
      
      // Extract name
      profile.name = this.extractName($);
      console.log('   Name:', profile.name);
      
      // Extract headline/bio line
      profile.headline = this.extractHeadline($);
      profile.bio_line = profile.headline;
      console.log('   Headline:', profile.headline);
      
      // Extract location
      profile.location = this.extractLocation($);
      console.log('   Location:', profile.location);
      
      // Extract about section (ENHANCED)
      profile.about = this.extractAbout($, html);
      console.log('   About:', profile.about ? profile.about.substring(0, 50) + '...' : 'N/A');
      
      // Extract follower count (ENHANCED)
      profile.follower_count = this.extractFollowerCount($, html);
      console.log('   Followers:', profile.follower_count);
      
      // Extract connection count (FIXED)
      profile.connection_count = this.extractConnectionCount($, html);
      console.log('   Connections:', profile.connection_count);

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
      'div.ph5 h1',
      'h1[class*="heading"]'
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
      '.pv-top-card--list.pv-top-card--list-bullet.mt1 li:first-child',
      'div[class*="headline"]'
    ];

    for (const selector of selectors) {
      const text = $(selector).first().text().trim();
      if (text && !text.includes('followers') && !text.includes('connections')) {
        return text;
      }
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
      '.pv-top-card--list-bullet li',
      'div[class*="location"]'
    ];

    for (const selector of selectors) {
      const text = $(selector).first().text().trim();
      if (text && 
          !text.toLowerCase().includes('contact info') && 
          !text.toLowerCase().includes('followers') &&
          !text.toLowerCase().includes('connections')) {
        return text;
      }
    }
    return '';
  }

  /**
   * Extract about section (ENHANCED with multiple strategies)
   */
  static extractAbout($, html) {
    // Strategy 1: Look for About section by ID and nearby content
    const aboutHeadings = $('h2, h3, div[id*="about"]').filter((i, el) => {
      const text = $(el).text().trim().toLowerCase();
      return text === 'about' || text.includes('about');
    });

    if (aboutHeadings.length > 0) {
      // Try to find content in various locations relative to heading
      const heading = aboutHeadings.first();
      
      // Method 1: Next sibling div
      let aboutText = heading.next('div').text().trim();
      if (aboutText && aboutText.length > 20) {
        return aboutText;
      }
      
      // Method 2: Parent's next sibling
      aboutText = heading.parent().next().text().trim();
      if (aboutText && aboutText.length > 20) {
        return aboutText;
      }
      
      // Method 3: Find display-flex container nearby
      aboutText = heading.parent().parent().find('.display-flex').first().text().trim();
      if (aboutText && aboutText.length > 20) {
        return aboutText;
      }
      
      // Method 4: Find any div with substantial text after About heading
      const nextDivs = heading.parent().parent().find('div');
      for (let i = 0; i < nextDivs.length; i++) {
        const text = $(nextDivs[i]).text().trim();
        if (text && text.length > 30 && text !== 'About' && !text.includes('Show all')) {
          return text;
        }
      }
    }

    // Strategy 2: Look for common About section CSS classes
    const aboutSelectors = [
      '.pv-about-section .pv-about__summary-text',
      'section[data-section="summary"] .pv-shared-text-with-see-more',
      '.pv-about__summary-text',
      'div[class*="about"] span[class*="text"]',
      'section div.display-flex.ph5.pv3',
      '.inline-show-more-text'
    ];

    for (const selector of aboutSelectors) {
      const text = $(selector).first().text().trim();
      if (text && text.length > 20) {
        return text;
      }
    }

    // Strategy 3: Text pattern matching in HTML
    // Look for "About" followed by substantial text
    const aboutMatch = html.match(/About[\s\S]{0,200}?<div[^>]*>([\s\S]{30,500}?)<\/div>/i);
    if (aboutMatch) {
      const $ = cheerio.load(aboutMatch[1]);
      const text = $.text().trim();
      if (text && text.length > 20) {
        return text;
      }
    }

    // Strategy 4: Find any substantial text block that looks like an about section
    const textBlocks = $('div span, div p').filter((i, el) => {
      const text = $(el).text().trim();
      return text.length > 50 && text.length < 1000;
    });

    for (let i = 0; i < textBlocks.length; i++) {
      const text = $(textBlocks[i]).text().trim();
      // Make sure it's not navigation or metadata
      if (!text.includes('followers') && 
          !text.includes('connections') && 
          !text.match(/^\d+/) &&
          !text.includes('Contact info') &&
          text.split(' ').length > 5) {
        return text;
      }
    }

    return '';
  }

  /**
   * Extract follower count (ENHANCED)
   */
  static extractFollowerCount($, html) {
    // Strategy 1: Look for follower text in links
    const links = $('a, span, div');
    for (let i = 0; i < links.length; i++) {
      const text = $(links[i]).text().toLowerCase();
      if (text.includes('follower')) {
        const match = text.match(/(\d+(?:[,\.]\d+)?[KkMm]?)\s*followers?/i);
        if (match) {
          const count = this.parseCount(match[1]);
          if (count > 0) {
            console.log('   Found followers via element:', text);
            return count;
          }
        }
      }
    }

    // Strategy 2: Search in full HTML text
    const followerPatterns = [
      /(\d+(?:[,\.]\d+)?[KkMm]?)\s*followers?/gi,
      /followers?[:\s]*(\d+(?:[,\.]\d+)?[KkMm]?)/gi
    ];

    for (const pattern of followerPatterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        const count = this.parseCount(match[1]);
        if (count > 0) {
          console.log('   Found followers via pattern:', match[0]);
          return count;
        }
      }
    }

    return 0;
  }

  /**
   * Extract connection count (FIXED to handle 500+)
   */
  static extractConnectionCount($, html) {
    // Strategy 1: Look for connection text in elements
    const elements = $('a, span, div, li');
    for (let i = 0; i < elements.length; i++) {
      const text = $(elements[i]).text().toLowerCase();
      if (text.includes('connection')) {
        const match = text.match(/(\d+(?:[,\.]\d+)?[KkMm]?\+?)\s*connections?/i);
        if (match) {
          const count = this.parseCount(match[1]);
          if (count > 0) {
            console.log('   Found connections via element:', text);
            return count;
          }
        }
      }
    }

    // Strategy 2: Search in full HTML with multiple patterns
    const connectionPatterns = [
      /(\d+(?:[,\.]\d+)?[KkMm]?\+?)\s*connections?/gi,
      /connections?[:\s]*(\d+(?:[,\.]\d+)?[KkMm]?\+?)/gi,
      // Specific pattern for "500+ connections"
      /(500\+)\s*connections?/gi
    ];

    for (const pattern of connectionPatterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        const count = this.parseCount(match[1]);
        if (count > 0) {
          console.log('   Found connections via pattern:', match[0]);
          return count;
        }
      }
    }

    return 0;
  }

  /**
   * Parse count string to number (FIXED to handle + symbol)
   * @param {string} text - Count text (e.g., "10K", "1.5M", "500+")
   * @returns {number}
   */
  static parseCount(text) {
    if (!text) return 0;
    
    const cleanText = text.toString().toLowerCase()
      .replace(/[,\s]/g, '') // Remove commas and spaces
      .replace(/\+$/, '');   // Remove trailing +
    
    // Handle special case: "500+" means 500
    if (text.includes('+')) {
      const num = parseInt(cleanText);
      return isNaN(num) ? 0 : num;
    }
    
    if (cleanText.includes('k')) {
      return Math.round(parseFloat(cleanText) * 1000);
    } else if (cleanText.includes('m')) {
      return Math.round(parseFloat(cleanText) * 1000000);
    }
    
    return parseInt(cleanText) || 0;
  }
}

module.exports = LinkedInScraper;