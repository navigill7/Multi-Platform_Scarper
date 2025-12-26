const API_BASE_URL = 'http://localhost:3000/api';

// DOM Elements
const platformName = document.getElementById('platformName');
const currentUrl = document.getElementById('currentUrl');
const pageStatus = document.getElementById('pageStatus');
const captureBtn = document.getElementById('captureBtn');
const captureResult = document.getElementById('captureResult');
const captureProgress = document.getElementById('captureProgress');
const profilePreview = document.getElementById('profilePreview');
const profileData = document.getElementById('profileData');
const linkedinCount = document.getElementById('linkedinCount');
const instagramCount = document.getElementById('instagramCount');
const refreshStats = document.getElementById('refreshStats');

// Initialize popup
(async function init() {
  await checkCurrentPage();
  await loadStats();
})();

/**
 * Check current page and determine if scraping is supported
 */
async function checkCurrentPage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.url) {
      updatePageInfo('Unknown', '-', 'unsupported', 'No active tab');
      return;
    }

    const url = tab.url;
    currentUrl.textContent = url.length > 40 ? url.substring(0, 40) + '...' : url;
    currentUrl.title = url;

    // Detect platform
    let platform = 'Unknown';
    let status = 'unsupported';
    let statusText = 'Unsupported page';

    if (url.includes('linkedin.com/in/')) {
      platform = 'LinkedIn';
      status = 'supported';
      statusText = '✅ Ready to scrape';
      captureBtn.disabled = false;
    } else if (url.match(/instagram\.com\/[^/]+\/?$/)) {
      platform = 'Instagram';
      status = 'supported';
      statusText = '✅ Ready to scrape';
      captureBtn.disabled = false;
    } else if (url.includes('linkedin.com')) {
      statusText = '⚠️ Not a profile page';
    } else if (url.includes('instagram.com')) {
      statusText = '⚠️ Not a profile page';
    }

    updatePageInfo(platform, url, status, statusText);

  } catch (error) {
    console.error('Error checking page:', error);
    updatePageInfo('Error', '-', 'unsupported', error.message);
  }
}

/**
 * Update page info display
 */
function updatePageInfo(platform, url, status, statusText) {
  platformName.textContent = platform;
  pageStatus.textContent = statusText;
  pageStatus.className = `value status-${status}`;
}

/**
 * Capture button click handler
 */
captureBtn.addEventListener('click', async () => {
  try {
    captureBtn.disabled = true;
    captureBtn.textContent = 'Capturing...';
    captureProgress.innerHTML = '';
    captureProgress.classList.add('show');
    profilePreview.style.display = 'none';

    showProgress('🔄 Capturing page HTML...', 'info');

    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Inject content script to capture HTML
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: capturePageHTML
    });

    const html = results[0]?.result;

    if (!html || html.length < 100) {
      throw new Error('Failed to capture page HTML or page is too small');
    }

    showProgress(`✅ Captured ${(html.length / 1024).toFixed(1)} KB of HTML`, 'success');
    showProgress('📤 Sending to backend...', 'info');

    // Send to backend
    const response = await fetch(`${API_BASE_URL}/scrape-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: tab.url,
        html: html
      })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      showProgress('✅ Profile scraped successfully!', 'success');
      displayProfileData(data.data);
      await loadStats();
    } else {
      throw new Error(data.message || 'Scraping failed');
    }

  } catch (error) {
    console.error('Capture error:', error);
    showProgress(`❌ Error: ${error.message}`, 'error');
    showResult(`Error: ${error.message}`, 'error');
  } finally {
    captureBtn.disabled = false;
    captureBtn.textContent = 'Send Page to Backend';
  }
});

/**
 * Function to capture page HTML (runs in page context)
 */
function capturePageHTML() {
  return document.documentElement.outerHTML;
}

/**
 * Display extracted profile data
 */
function displayProfileData(data) {
  profilePreview.style.display = 'block';
  
  let html = '';
  
  if (data.platform === 'linkedin') {
    html = `
      <div class="profile-field"><strong>Name:</strong> ${escapeHtml(data.name) || 'N/A'}</div>
      <div class="profile-field"><strong>Headline:</strong> ${escapeHtml(data.headline || data.bio_line) || 'N/A'}</div>
      <div class="profile-field"><strong>Location:</strong> ${escapeHtml(data.location) || 'N/A'}</div>
      <div class="profile-field"><strong>Followers:</strong> ${formatNumber(data.follower_count)}</div>
      <div class="profile-field"><strong>Connections:</strong> ${formatNumber(data.connection_count)}</div>
      <div class="profile-field"><strong>About:</strong> ${truncate(escapeHtml(data.about), 100) || 'N/A'}</div>
    `;
  } else if (data.platform === 'instagram') {
    html = `
      <div class="profile-field"><strong>Username:</strong> @${escapeHtml(data.username) || 'N/A'}</div>
      <div class="profile-field"><strong>Display Name:</strong> ${escapeHtml(data.display_name) || 'N/A'}</div>
      <div class="profile-field"><strong>Followers:</strong> ${formatNumber(data.follower_count)}</div>
      <div class="profile-field"><strong>Following:</strong> ${formatNumber(data.following_count)}</div>
      <div class="profile-field"><strong>Posts:</strong> ${formatNumber(data.post_count)}</div>
      <div class="profile-field"><strong>Verified:</strong> ${data.is_verified ? '✅ Yes' : '❌ No'}</div>
      <div class="profile-field"><strong>Private:</strong> ${data.is_private ? '🔒 Yes' : '🌐 Public'}</div>
      <div class="profile-field"><strong>Bio:</strong> ${truncate(escapeHtml(data.bio), 100) || 'N/A'}</div>
    `;
  }
  
  profileData.innerHTML = html;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Load statistics from backend
 */
async function loadStats() {
  try {
    const [linkedinRes, instagramRes] = await Promise.all([
      fetch(`${API_BASE_URL}/profiles/linkedin`),
      fetch(`${API_BASE_URL}/profiles/instagram`)
    ]);

    const linkedinData = await linkedinRes.json();
    const instagramData = await instagramRes.json();

    linkedinCount.textContent = linkedinData.count || 0;
    instagramCount.textContent = instagramData.count || 0;
  } catch (error) {
    console.error('Error loading stats:', error);
    linkedinCount.textContent = '?';
    instagramCount.textContent = '?';
  }
}

/**
 * Refresh stats button
 */
refreshStats.addEventListener('click', loadStats);

/**
 * Show progress message
 */
function showProgress(message, type = 'info') {
  const progressItem = document.createElement('div');
  progressItem.className = `progress-item ${type}`;
  progressItem.textContent = message;
  captureProgress.appendChild(progressItem);
  captureProgress.scrollTop = captureProgress.scrollHeight;
}

/**
 * Show result message
 */
function showResult(message, type = 'info') {
  captureResult.textContent = message;
  captureResult.className = `result ${type} show`;
}

/**
 * Format large numbers
 */
function formatNumber(num) {
  if (!num || num === 0) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

/**
 * Truncate text
 */
function truncate(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}