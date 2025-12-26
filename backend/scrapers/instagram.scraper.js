/**
 * Instagram Profile Scraper (ENHANCED - Multiple extraction strategies)
 * Parses Instagram profile HTML to extract ONLY the viewed profile data
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
      console.log('🎯 Target username:', profile.username);
      
      // Strategy 1: Extract from embedded JSON data
      const jsonData = this.extractFromEmbeddedJSON(html, profile.username);
      if (jsonData) {
        console.log('✅ Found embedded JSON data');
        Object.assign(profile, jsonData);
      }
      
      // Strategy 2: Extract from meta tags
      if (!profile.display_name || profile.follower_count === 0) {
        console.log('📋 Trying meta tags...');
        const metaData = this.extractFromMetaTags($);
        if (metaData.display_name) profile.display_name = metaData.display_name;
        if (metaData.bio) profile.bio = metaData.bio;
        if (metaData.follower_count > 0) profile.follower_count = metaData.follower_count;
        if (metaData.following_count > 0) profile.following_count = metaData.following_count;
        if (metaData.post_count > 0) profile.post_count = metaData.post_count;
      }
      
      // Strategy 3: Extract from visible page elements
      if (!profile.display_name) {
        console.log('🔍 Trying DOM extraction...');
        const domData = this.extractFromDOM($, profile.username);
        if (domData.display_name) profile.display_name = domData.display_name;
        if (domData.bio) profile.bio = domData.bio;
        if (domData.is_verified) profile.is_verified = domData.is_verified;
      }
      
      // Strategy 4: Main content text extraction for counts
      if (profile.follower_count === 0 || profile.following_count === 0) {
        console.log('📄 Trying main content extraction...');
        this.extractFromMainContent($, profile);
      }

      console.log('✅ Instagram profile scraped successfully:', profile.username);
      console.log('   Display Name:', profile.display_name || 'N/A');
      console.log('   Bio:', profile.bio ? profile.bio.substring(0, 50) + '...' : 'N/A');
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
   * Extract data from embedded JSON
   */
  static extractFromEmbeddedJSON(html, targetUsername) {
    try {
      // Method 1: window._sharedData (older Instagram)
      const sharedDataMatch = html.match(/<script[^>]*>window\._sharedData\s*=\s*({.+?});<\/script>/);
      if (sharedDataMatch) {
        try {
          const jsonData = JSON.parse(sharedDataMatch[1]);
          const userData = jsonData?.entry_data?.ProfilePage?.[0]?.graphql?.user;
          
          if (userData && userData.username === targetUsername) {
            return {
              display_name: userData.full_name || '',
              bio: userData.biography || '',
              follower_count: userData.edge_followed_by?.count || 0,
              following_count: userData.edge_follow?.count || 0,
              post_count: userData.edge_owner_to_timeline_media?.count || 0,
              is_verified: userData.is_verified || false,
              is_private: userData.is_private || false
            };
          }
        } catch (e) {
          console.log('Failed to parse _sharedData');
        }
      }

      // Method 2: Search all script tags with type="application/json"
      const scriptRegex = /<script[^>]*type="application\/json"[^>]*>({.*?})<\/script>/gs;
      let match;
      
      while ((match = scriptRegex.exec(html)) !== null) {
        try {
          const jsonText = match[1];
          const data = JSON.parse(jsonText);
          
          const userData = this.findUserDataInObject(data, targetUsername);
          if (userData) {
            console.log('✅ Found user data in JSON blob');
            return {
              display_name: userData.full_name || userData.fullName || '',
              bio: userData.biography || userData.bio || '',
              follower_count: userData.edge_followed_by?.count || userData.follower_count || 0,
              following_count: userData.edge_follow?.count || userData.following_count || 0,
              post_count: userData.edge_owner_to_timeline_media?.count || userData.media_count || 0,
              is_verified: userData.is_verified || userData.verified || false,
              is_private: userData.is_private || false
            };
          }
        } catch (e) {
          continue;
        }
      }

      // Method 3: Search for inline user data patterns
      const patterns = [
        // Pattern with full data
        new RegExp(`"username":"${targetUsername}"[^}]{0,500}"full_name":"([^"]+)"[^}]{0,500}"biography":"([^"]*)"[^}]{0,500}"edge_followed_by":\\{"count":(\\d+)\\}`, 'i'),
        // Pattern without follower counts
        new RegExp(`"username":"${targetUsername}"[^}]{0,300}"full_name":"([^"]+)"[^}]{0,300}"biography":"([^"]*)"`, 'i'),
      ];
      
      for (const pattern of patterns) {
        const userMatch = html.match(pattern);
        if (userMatch) {
          console.log('✅ Found user data via pattern matching');
          return {
            display_name: userMatch[1] || '',
            bio: (userMatch[2] || '').replace(/\\n/g, '\n').replace(/\\"/g, '"'),
            follower_count: userMatch[3] ? parseInt(userMatch[3]) : 0
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Error extracting from JSON:', error);
      return null;
    }
  }

  /**
   * Recursively search for user data in nested objects
   */
  static findUserDataInObject(obj, targetUsername, depth = 0) {
    if (depth > 15) return null;
    if (!obj || typeof obj !== 'object') return null;
    
    // Check if this object is the target user
    if (obj.username === targetUsername) {
      // Verify it has profile data
      if (obj.full_name || obj.fullName || obj.biography || obj.edge_followed_by) {
        return obj;
      }
    }
    
    // Search nested structures
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const result = this.findUserDataInObject(obj[key], targetUsername, depth + 1);
        if (result) return result;
      }
    }
    
    return null;
  }

  /**
   * Extract from meta tags
   */
  static extractFromMetaTags($) {
    const ogTitle = $('meta[property="og:title"]').attr('content') || '';
    const ogDescription = $('meta[property="og:description"]').attr('content') || '';
    const description = $('meta[name="description"]').attr('content') || '';
    
    console.log('Meta og:title:', ogTitle);
    console.log('Meta og:description:', ogDescription);
    
    let displayName = '';
    let bio = '';
    
    // Extract display name from title
    // Format: "Dhruv Rathee (@dhruvrathee) • Instagram photos and videos"
    const titleMatch = ogTitle.match(/^([^(]+)\s*\(@[^)]+\)/);
    if (titleMatch) {
      displayName = titleMatch[1].trim();
    } else {
      // Alternative: "Name • Instagram"
      const altMatch = ogTitle.match(/^([^•]+)/);
      if (altMatch) {
        displayName = altMatch[1].trim();
      }
    }
    
    // Try to extract bio from description
    // Instagram descriptions often have format: "16M Followers, 405 Following, 870 Posts - Bio text here"
    const bioMatch = ogDescription.match(/Posts\s*-\s*(.+)$/i);
    if (bioMatch) {
      bio = bioMatch[1].trim();
    }
    
    // Parse counts from description
    const textToParse = ogDescription || description;
    const followerMatch = textToParse.match(/(\d+(?:\.\d+)?[KMB]?)\s*Followers?/i);
    const followingMatch = textToParse.match(/(\d+(?:\.\d+)?[KMB]?)\s*Following/i);
    const postMatch = textToParse.match(/(\d+(?:\.\d+)?[KMB]?)\s*Posts?/i);
    
    return {
      display_name: displayName,
      bio: bio,
      follower_count: followerMatch ? this.parseCount(followerMatch[1]) : 0,
      following_count: followingMatch ? this.parseCount(followingMatch[1]) : 0,
      post_count: postMatch ? this.parseCount(postMatch[1]) : 0
    };
  }

  /**
   * Extract from visible DOM elements
   */
  static extractFromDOM($, targetUsername) {
    const result = {
      display_name: '',
      bio: '',
      is_verified: false
    };
    
    // Find header section (usually contains name)
    const header = $('header, section header').first();
    
    // Look for name in various possible locations
    const nameSelectors = [
      'h1',
      'h2',
      '.x1lliihq', // Instagram class
      '[class*="Title"]',
      'span[dir="auto"]'
    ];
    
    for (const selector of nameSelectors) {
      const element = header.find(selector).first();
      const text = element.text().trim();
      
      // Make sure it's not the username (no @)
      if (text && text !== targetUsername && !text.startsWith('@') && text.length > 0) {
        result.display_name = text;
        console.log(`Found name via ${selector}:`, text);
        break;
      }
    }
    
    // Look for bio
    const bioSelectors = [
      'div._aa_c span', // Common Instagram bio class
      'header + div span',
      '[class*="biography"]',
      'section div span[dir="auto"]'
    ];
    
    for (const selector of bioSelectors) {
      const elements = $(selector);
      elements.each((i, elem) => {
        const text = $(elem).text().trim();
        // Bio is usually longer and doesn't match username/name
        if (text && text.length > 10 && 
            text !== targetUsername && 
            text !== result.display_name &&
            !text.match(/^\d+[KM]?\s+(followers?|following|posts?)/i)) {
          result.bio = text;
          console.log('Found bio via', selector);
          return false; // break
        }
      });
      if (result.bio) break;
    }
    
    // Check for verified badge
    const verifiedBadge = $('svg[aria-label*="Verified"], span[aria-label*="Verified"]');
    if (verifiedBadge.length > 0) {
      result.is_verified = true;
    }
    
    return result;
  }

  /**
   * Extract from main content area
   */
  static extractFromMainContent($, profile) {
    const mainContent = $('main, section[role="main"], article').first();
    
    if (mainContent.length === 0) {
      console.log('Warning: Could not find main content area');
      return;
    }
    
    const mainText = mainContent.text();
    
    // Extract counts
    if (!profile.follower_count) {
      const followerMatch = mainText.match(/(\d+(?:\.\d+)?[KMB]?)\s*followers?/i);
      if (followerMatch) {
        profile.follower_count = this.parseCount(followerMatch[1]);
      }
    }
    
    if (!profile.following_count) {
      const followingMatch = mainText.match(/(\d+(?:\.\d+)?[KMB]?)\s*following/i);
      if (followingMatch) {
        profile.following_count = this.parseCount(followingMatch[1]);
      }
    }
    
    if (!profile.post_count) {
      const postMatch = mainText.match(/(\d+(?:\.\d+)?[KMB]?)\s*posts?/i);
      if (postMatch) {
        profile.post_count = this.parseCount(postMatch[1]);
      }
    }
    
    // Check for private account
    if (mainText.includes('This Account is Private') || mainText.includes('This account is private')) {
      profile.is_private = true;
    }
  }

  /**
   * Parse count string to number
   */
  static parseCount(text) {
    if (!text) return 0;
    if (typeof text === 'number') return text;
    
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