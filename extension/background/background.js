/**
 * Background Service Worker
 * Handles events and communications
 * NO SCRAPING LOGIC - only orchestration
 */

const API_BASE_URL = 'http://localhost:3000/api';

console.log('🚀 Multi-Platform Scraper background service worker started');

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('✅ Extension installed successfully');
  } else if (details.reason === 'update') {
    console.log('🔄 Extension updated');
  }
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'pageNavigated') {
    console.log('📍 Page navigated to:', message.url);
  }
  
  if (message.action === 'checkHealth') {
    checkBackendHealth().then(status => {
      sendResponse({ success: true, status });
    });
    return true; // Keep channel open
  }
  
  return false;
});

// Handle browser action click (optional)
chrome.action.onClicked.addListener((tab) => {
  console.log('Extension icon clicked on tab:', tab.id);
});

/**
 * Check if backend is running
 */
async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
    const data = await response.json();
    return data.status === 'ok' ? 'online' : 'error';
  } catch (error) {
    console.error('Backend health check failed:', error);
    return 'offline';
  }
}

/**
 * Periodic health check (every 5 minutes)
 */
setInterval(async () => {
  const status = await checkBackendHealth();
  console.log('Backend status:', status);
}, 5 * 60 * 1000);