/**
 * Content Script
 * This script runs in the context of LinkedIn and Instagram pages
 * It does NOT perform any scraping - only captures HTML when requested
 */

console.log('🔧 Multi-Platform Scraper content script loaded');

// Listen for messages from popup or background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getPageHTML') {
    // Capture and return the full page HTML
    const html = document.documentElement.outerHTML;
    sendResponse({ 
      success: true, 
      html: html,
      url: window.location.href
    });
  }
  
  return true; // Keep message channel open for async response
});

// Optional: Monitor page changes (for Single Page Apps like LinkedIn)
let currentUrl = location.href;

new MutationObserver(() => {
  if (location.href !== currentUrl) {
    currentUrl = location.href;
    console.log('📍 Page navigation detected:', currentUrl);
    
    // Notify background script about navigation
    chrome.runtime.sendMessage({
      action: 'pageNavigated',
      url: currentUrl
    }).catch(err => {
      // Extension context might be invalidated
      console.log('Background script not available');
    });
  }
}).observe(document, { subtree: true, childList: true });