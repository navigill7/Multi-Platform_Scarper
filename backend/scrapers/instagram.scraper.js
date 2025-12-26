/**
 * Instagram Profile Scraper (FIXED VERSION)
 * Parses Instagram profile HTML to extract structured data
 */

const cheerio = require('cheerio');

class InstagramScraper {
  /**
   * Parse Instagram profile HTML
   * @param {string} html - Full page HTML
   * @param {string} url - Profile URL
   * @returns {object} - Extracted profile data
   */
  static scrape(html, url) {
    const $ = cheerio.load(html);
    
    const profile = {
      platform: 'instagram',
      url: url,
      username: '',
      display_name: '',
      bio: '',
      follower_count: 0,
      following_count: 0,
      post_count: 0,
      is_verified: false,
      is_private: false,
      scraped_at: new Date().toISOString()
    };

    try {
      // Extract username from URL
      profile.username = this.extractUsername(url);
      
      // Try to extract from embedded JSON data (most reliable for Instagram)
      const jsonData = this.extractFromEmbeddedJSON(html);
      if (jsonData) {
        console.log('✅ Found embedded JSON data');
        Object.assign(profile, jsonData);
      }
      
      // Fallback: Extract from meta tags
      if (!profile.display_name || profile.follower_count === 0) {
        console.log('📋 Trying meta tags...');
        const metaData = this.extractFromMetaTags($);
        Object.assign(profile, { ...metaData, ...profile }); // Don't overwrite existing data
      }
      
      // Fallback: Extract from page text
      if (profile.follower_count === 0 || profile.following_count === 0) {
        console.log('📄 Trying text extraction...');
        this.extractFromPageText($, profile);
      }

      console.log('✅ Instagram profile scraped successfully:', profile.username);
      console.log('   Display Name:', profile.display_name);
      console.log('   Followers:', profile.follower_count);
      console.log('   Following:', profile.following_count);
      console.log('   Posts:', profile.post_count);
      console.log('   Verified:', profile.is_verified);
      
      return profile;
    } catch (error) {
      console.error('❌ Error scraping Instagram profile:', error);
      return profile;
    }
  }

  /**
   * Extract username from URL
   */
  static extractUsername(url) {
    const match = url.match(/instagram\.com\/([^/?]+)/i);
    return match ? match[1] : '';
  }

  /**
   * Extract data from embedded JSON (React props)
   */
  static extractFromEmbeddedJSON(html) {
    try {
      // Instagram embeds user data in <script> tags
      // Look for window._sharedData or similar patterns
      
      // Pattern 1: Look for JSON in script tags
      const scriptMatches = html.match(/<script[^>]*>window\._sharedData\s*=\s*({.+?});<\/script>/);
      if (scriptMatches) {
        const jsonData = JSON.parse(scriptMatches[1]);
        const userData = jsonData?.entry_data?.ProfilePage?.[0]?.graphql?.user;
        
        if (userData) {
          return {
            display_name: userData.full_name || userData.username || '',
            bio: userData.biography || '',
            follower_count: userData.edge_followed_by?.count || 0,
            following_count: userData.edge_follow?.count || 0,
            post_count: userData.edge_owner_to_timeline_media?.count || 0,
            is_verified: userData.is_verified || false,
            is_private: userData.is_private || false
          };
        }
      }

      // Pattern 2: Look for newer JSON structure
      const requireMatches = html.matchAll(/<script[^>]*>.*?({.*?"require".*?})<\/script>/gs);
      for (const match of requireMatches) {
        try {
          const jsonText = match[1];
          if (jsonText.includes('ProfilePage') || jsonText.includes('user')) {
            // Try to extract user data from complex nested structure
            const userMatch = jsonText.match(/"full_name":"([^"]+)"/);
            const bioMatch = jsonText.match(/"biography":"([^"]+)"/);
            const followerMatch = jsonText.match(/"edge_followed_by":\{"count":(\d+)\}/);
            const followingMatch = jsonText.match(/"edge_follow":\{"count":(\d+)\}/);
            const postMatch = jsonText.match(/"edge_owner_to_timeline_media":\{"count":(\d+)\}/);
            const verifiedMatch = jsonText.match(/"is_verified":(true|false)/);
            const privateMatch = jsonText.match(/"is_private":(true|false)/);

            if (userMatch || followerMatch) {
              return {
                display_name: userMatch ? userMatch[1] : '',
                bio: bioMatch ? bioMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : '',
                follower_count: followerMatch ? parseInt(followerMatch[1]) : 0,
                following_count: followingMatch ? parseInt(followingMatch[1]) : 0,
                post_count: postMatch ? parseInt(postMatch[1]) : 0,
                is_verified: verifiedMatch ? verifiedMatch[1] === 'true' : false,
                is_private: privateMatch ? privateMatch[1] === 'true' : false
              };
            }
          }
        } catch (e) {
          continue;
        }
      }

      return null;
    } catch (error) {
      console.error('Error extracting from JSON:', error);
      return null;
    }
  }

  /**
   * Extract from meta tags
   */
  static extractFromMetaTags($) {
    const ogTitle = $('meta[property="og:title"]').attr('content') || '';
    const ogDescription = $('meta[property="og:description"]').attr('content') || '';
    const description = $('meta[name="description"]').attr('content') || '';
    
    // Parse title: "Dhruv Rathee (@dhruvrathee) • Instagram photos and videos"
    let displayName = '';
    const titleMatch = ogTitle.match(/^([^(]+)\s*\(@[^)]+\)/);
    if (titleMatch) {
      displayName = titleMatch[1].trim();
    } else {
      // Alternative pattern
      const altMatch = ogTitle.match(/^([^•]+)/);
      if (altMatch) {
        displayName = altMatch[1].replace(/\(@[^)]+\)/, '').trim();
      }
    }
    
    // Parse description: "16M Followers, 405 Following, 870 Posts - See Instagram photos..."
    const textToParse = ogDescription || description;
    
    const followerMatch = textToParse.match(/(\d+(?:\.\d+)?[KMB]?)\s*Followers?/i);
    const followingMatch = textToParse.match(/(\d+(?:\.\d+)?[KMB]?)\s*Following/i);
    const postMatch = textToParse.match(/(\d+(?:\.\d+)?[KMB]?)\s*Posts?/i);
    
    return {
      display_name: displayName,
      follower_count: followerMatch ? this.parseCount(followerMatch[1]) : 0,
      following_count: followingMatch ? this.parseCount(followingMatch[1]) : 0,
      post_count: postMatch ? this.parseCount(postMatch[1]) : 0
    };
  }

  /**
   * Extract from page text (final fallback)
   */
  static extractFromPageText($, profile) {
    const bodyText = $('body').text();
    
    // More aggressive pattern matching
    if (!profile.follower_count) {
      // Try various patterns
      const patterns = [
        /(\d+(?:\.\d+)?[KMB]?)\s*followers?/i,
        /followers?[:\s]+(\d+(?:\.\d+)?[KMB]?)/i,
      ];
      
      for (const pattern of patterns) {
        const match = bodyText.match(pattern);
        if (match) {
          profile.follower_count = this.parseCount(match[1]);
          break;
        }
      }
    }
    
    if (!profile.following_count) {
      const patterns = [
        /(\d+(?:\.\d+)?[KMB]?)\s*following/i,
        /following[:\s]+(\d+(?:\.\d+)?[KMB]?)/i,
      ];
      
      for (const pattern of patterns) {
        const match = bodyText.match(pattern);
        if (match) {
          profile.following_count = this.parseCount(match[1]);
          break;
        }
      }
    }
    
    if (!profile.post_count) {
      const patterns = [
        /(\d+(?:\.\d+)?[KMB]?)\s*posts?/i,
        /posts?[:\s]+(\d+(?:\.\d+)?[KMB]?)/i,
      ];
      
      for (const pattern of patterns) {
        const match = bodyText.match(pattern);
        if (match) {
          profile.post_count = this.parseCount(match[1]);
          break;
        }
      }
    }
    
    // Check for verified badge
    if (!profile.is_verified) {
      if (bodyText.includes('Verified') || $('[aria-label*="Verified"]').length > 0) {
        profile.is_verified = true;
      }
    }
    
    // Check for private account
    if (bodyText.includes('This Account is Private') || bodyText.includes('This account is private')) {
      profile.is_private = true;
    }
  }

  /**
   * Parse count string to number
   * @param {string|number} text - Count text (e.g., "10K", "1.5M", "500")
   * @returns {number}
   */
  static parseCount(text) {
    if (!text) return 0;
    if (typeof text === 'number') return text;
    
    // Remove any non-numeric characters except . K M B
    const cleanText = text.toString().toUpperCase().replace(/[^0-9.KMB]/g, '');
    
    if (cleanText.includes('B')) {
      return Math.round(parseFloat(cleanText) * 1000000000);
    } else if (cleanText.includes('M')) {
      return Math.round(parseFloat(cleanText) * 1000000);
    } else if (cleanText.includes('K')) {
      return Math.round(parseFloat(cleanText) * 1000);
    }
    
    return parseInt(cleanText.replace(/[,.]/g, '')) || 0;
  }
}

module.exports = InstagramScraper;