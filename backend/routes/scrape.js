const express = require('express');
const router = express.Router();
const ScraperFactory = require('../scrapers/scraper.factory');
const LinkedinProfile = require('../models/LinkedinProfile');
const InstagramProfile = require('../models/InstagramProfile');

/**
 * POST /api/scrape-profile
 * Main endpoint for receiving HTML and extracting profile data
 */
router.post('/scrape-profile', async (req, res) => {
  try {
    const { url, html } = req.body;

    console.log('📥 Received scrape request');
    console.log(`   URL: ${url?.substring(0, 50)}...`);
    console.log(`   HTML Length: ${html?.length || 0} characters`);

    // Validate request
    const validation = ScraperFactory.validate(url, html);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request',
        errors: validation.errors
      });
    }

    // Scrape profile data
    const profileData = ScraperFactory.scrapeProfile(url, html);

    console.log('✅ Scraping successful');
    console.log(`   Platform: ${profileData.platform}`);
    console.log(`   Profile: ${profileData.name || profileData.username || 'Unknown'}`);

    // Save to database based on platform
    let savedProfile;
    
    if (profileData.platform === 'linkedin') {
      savedProfile = await saveLinkedInProfile(profileData);
    } else if (profileData.platform === 'instagram') {
      savedProfile = await saveInstagramProfile(profileData);
    }

    // Return response
    res.status(200).json({
      success: true,
      platform: profileData.platform,
      message: 'Profile scraped successfully',
      data: profileData,
      saved: savedProfile ? true : false
    });

  } catch (error) {
    console.error('❌ Scraping error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to scrape profile',
      error: error.message
    });
  }
});

/**
 * GET /api/profiles/:platform
 * Get all profiles for a specific platform
 */
router.get('/profiles/:platform', async (req, res) => {
  try {
    const { platform } = req.params;

    let profiles;
    
    if (platform === 'linkedin') {
      profiles = await LinkedinProfile.findAll({
        order: [['createdAt', 'DESC']]
      });
    } else if (platform === 'instagram') {
      profiles = await InstagramProfile.findAll({
        order: [['createdAt', 'DESC']]
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid platform'
      });
    }

    res.status(200).json({
      success: true,
      platform: platform,
      count: profiles.length,
      data: profiles
    });

  } catch (error) {
    console.error('Error fetching profiles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profiles',
      error: error.message
    });
  }
});

/**
 * GET /api/supported-platforms
 * Get list of supported platforms
 */
router.get('/supported-platforms', (req, res) => {
  const platforms = ScraperFactory.getSupportedPlatforms();
  
  res.status(200).json({
    success: true,
    platforms: platforms,
    count: platforms.length
  });
});

/**
 * Helper: Save LinkedIn profile to database
 */
async function saveLinkedInProfile(profileData) {
  try {
    const [profile, created] = await LinkedinProfile.upsert({
      name: profileData.name,
      url: profileData.url,
      about: profileData.about,
      bio: profileData.about,
      bio_line: profileData.bio_line || profileData.headline,
      location: profileData.location,
      follower_count: profileData.follower_count,
      connection_count: profileData.connection_count
    });

    console.log(`💾 LinkedIn profile ${created ? 'created' : 'updated'}: ${profileData.name}`);
    return profile;
  } catch (error) {
    console.error('Error saving LinkedIn profile:', error);
    return null;
  }
}

/**
 * Helper: Save Instagram profile to database
 */
async function saveInstagramProfile(profileData) {
  try {
    const [profile, created] = await InstagramProfile.upsert({
      username: profileData.username,
      display_name: profileData.display_name,
      url: profileData.url,
      bio: profileData.bio,
      follower_count: profileData.follower_count,
      following_count: profileData.following_count,
      post_count: profileData.post_count,
      is_verified: profileData.is_verified,
      is_private: profileData.is_private
    });

    console.log(`💾 Instagram profile ${created ? 'created' : 'updated'}: ${profileData.username}`);
    return profile;
  } catch (error) {
    console.error('Error saving Instagram profile:', error);
    return null;
  }
}

module.exports = router;