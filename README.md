# 🔍 Multi-Platform Profile Scraping via HTML Handoff

A sophisticated Chrome Extension (Manifest V3) with Node.js backend that enables intelligent profile scraping from LinkedIn and Instagram through HTML handoff architecture.

![Architecture](https://img.shields.io/badge/Architecture-HTML_Handoff-blue)
![Manifest](https://img.shields.io/badge/Manifest-V3-green)
![Platforms](https://img.shields.io/badge/Platforms-LinkedIn%20%7C%20Instagram-orange)

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Usage](#usage)
- [Technical Implementation](#technical-implementation)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

This project demonstrates a **clean separation of concerns** approach to web scraping:

- **Extension**: Captures raw HTML, zero scraping logic
- **Backend**: Intelligent parsing, platform detection, data extraction

### Why HTML Handoff?

✅ **Maintainability**: Update scraping logic without touching extension  
✅ **Security**: No sensitive code in client  
✅ **Scalability**: Add new platforms easily  
✅ **Reliability**: Backend handles complex parsing

---

## 🏗️ Architecture

```
┌─────────────────┐
│  Chrome Browser │
│  (User logged)  │
└────────┬────────┘
         │
         │ User clicks "Send to Backend"
         ▼
┌─────────────────┐
│   Extension     │
│  (Manifest V3)  │
│                 │
│  • Captures:    │
│    - URL        │
│    - Full HTML  │
│  • No scraping! │
└────────┬────────┘
         │
         │ POST { url, html }
         ▼
┌─────────────────┐
│  Backend API    │
│   (Node.js)     │
│                 │
│  1. Detect      │
│     Platform    │
│  2. Route to    │
│     Scraper     │
│  3. Extract     │
│     Data        │
│  4. Store in DB │
└────────┬────────┘
         │
         │ Return JSON
         ▼
    ┌──────────┐
    │ Response │
    └──────────┘
```

### Key Components

1. **Platform Detector** (`platform.detector.js`)
   - Analyzes URL patterns
   - Returns: `linkedin`, `instagram`, or `null`

2. **Scraper Factory** (`scraper.factory.js`)
   - Routes to correct scraper
   - Validates requests
   - Handles errors gracefully

3. **Platform Scrapers**
   - `linkedin.scraper.js`: LinkedIn-specific logic
   - `instagram.scraper.js`: Instagram-specific logic
   - Uses **Cheerio** for HTML parsing

---

## ✨ Features

### Extension Features
- ✅ Real-time platform detection
- ✅ One-click HTML capture
- ✅ Live progress tracking
- ✅ Profile data preview
- ✅ Statistics dashboard
- ✅ Beautiful UI with gradients

### Backend Features
- ✅ URL-based platform routing
- ✅ Robust HTML parsing (Cheerio)
- ✅ Duplicate detection
- ✅ SQLite database storage
- ✅ RESTful API
- ✅ Comprehensive logging

### Supported Platforms

| Platform | Profile URL Pattern | Data Extracted |
|----------|-------------------|----------------|
| **LinkedIn** | `linkedin.com/in/{username}` | Name, Headline, Location, About, Followers, Connections |
| **Instagram** | `instagram.com/{username}` | Username, Display Name, Bio, Followers, Following, Posts, Verified Status |

---

## 📁 Project Structure

```
multi-platform-scraper/
│
├── extension/                    # Chrome Extension
│   ├── manifest.json            # Manifest V3 configuration
│   ├── popup/
│   │   ├── popup.html          # Extension UI
│   │   ├── popup.css           # Styling
│   │   └── popup.js            # UI logic
│   ├── background/
│   │   └── background.js       # Service worker
│   ├── content/
│   │   └── content.js          # Page context script
│   └── icons/
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
│
└── backend/                      # Node.js Backend
    ├── server.js                # Express server
    ├── package.json
    ├── config/
    │   └── database.js          # SQLite configuration
    ├── models/
    │   ├── LinkedinProfile.js   # LinkedIn schema
    │   └── InstagramProfile.js  # Instagram schema
    ├── routes/
    │   └── scrape.js            # API endpoints
    ├── scrapers/
    │   ├── linkedin.scraper.js  # LinkedIn parser
    │   ├── instagram.scraper.js # Instagram parser
    │   └── scraper.factory.js   # Router/dispatcher
    └── utils/
        └── platform.detector.js # URL analyzer
```

---

## 🚀 Installation

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Google Chrome** (latest version)

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

   You should see:
   ```
   ✅ Database connection established
   ✅ Database models synchronized
   🚀 Server running on: http://localhost:3000
   ```

### Extension Setup

1. **Open Chrome and navigate to**
   ```
   chrome://extensions/
   ```

2. **Enable "Developer mode"** (toggle in top-right)

3. **Click "Load unpacked"**

4. **Select the `extension/` folder**

5. **Verify installation**
   - Extension icon should appear in toolbar
   - Click icon to open popup

---

## 📖 Usage

### Step-by-Step Guide

#### For LinkedIn

1. **Log in to LinkedIn** manually (extension doesn't handle auth)
2. **Navigate to any profile**
   ```
   https://www.linkedin.com/in/williamhgates/
   ```
3. **Click extension icon** in toolbar
4. **Check page info**
   - Platform: LinkedIn ✅
   - Status: Ready to scrape
5. **Click "Send Page to Backend"**
6. **Wait for extraction** (2-5 seconds)
7. **View results** in popup

#### For Instagram

1. **Log in to Instagram** manually
2. **Navigate to any profile**
   ```
   https://www.instagram.com/cristiano/
   ```
3. **Click extension icon**
4. **Click "Send Page to Backend"**
5. **View extracted data**

### What Gets Extracted?

#### LinkedIn Profile
```json
{
  "platform": "linkedin",
  "name": "Bill Gates",
  "headline": "Co-chair, Bill & Melinda Gates Foundation",
  "location": "Seattle, Washington",
  "about": "Co-chair of the Bill & Melinda Gates Foundation...",
  "follower_count": 37000000,
  "connection_count": 500
}
```

#### Instagram Profile
```json
{
  "platform": "instagram",
  "username": "cristiano",
  "display_name": "Cristiano Ronaldo",
  "bio": "Manchester United star...",
  "follower_count": 600000000,
  "following_count": 500,
  "post_count": 3500,
  "is_verified": true,
  "is_private": false
}
```

---

## 🔧 Technical Implementation

### URL Detection Logic

The **Platform Detector** uses regex patterns:

```javascript
const PLATFORM_PATTERNS = {
  linkedin: /linkedin\.com\/in\//i,
  instagram: /instagram\.com\/[^/]+\/?$/i
};
```

**Examples:**
- ✅ `https://linkedin.com/in/username` → LinkedIn
- ✅ `https://www.instagram.com/username/` → Instagram
- ❌ `https://linkedin.com/feed` → Not supported
- ❌ `https://instagram.com/p/postid` → Not a profile

### Scraping Strategy

Both scrapers use **multiple fallback methods**:

#### Method 1: JSON-LD Structured Data
```javascript
const script = document.querySelector('script[type="application/ld+json"]');
const data = JSON.parse(script.textContent);
```

#### Method 2: Meta Tags
```javascript
const ogTitle = document.querySelector('meta[property="og:title"]');
```

#### Method 3: CSS Selectors
```javascript
const name = document.querySelector('h1.text-heading-xlarge');
```

#### Method 4: Text Pattern Matching
```javascript
const match = bodyText.match(/(\d+[KM]?)\s*followers?/i);
```

### Count Parsing

Handles various formats:
- `1,234` → 1234
- `10K` → 10000
- `1.5M` → 1500000
- `500+` → 500

---

## 🧪 Testing

### Test LinkedIn Profile

```bash
# Test with Bill Gates profile
URL: https://www.linkedin.com/in/williamhgates/

Expected Results:
✅ Name extracted
✅ Headline extracted
✅ Location extracted
✅ Follower count > 30M
✅ Connection count extracted
```

### Test Instagram Profile

```bash
# Test with Cristiano Ronaldo
URL: https://www.instagram.com/cristiano/

Expected Results:
✅ Username: cristiano
✅ Display name extracted
✅ Follower count > 500M
✅ Following count extracted
✅ Verified: true
```

### API Testing

```bash
# Check backend health
curl http://localhost:3000/health

# Get supported platforms
curl http://localhost:3000/api/supported-platforms

# Get all LinkedIn profiles
curl http://localhost:3000/api/profiles/linkedin

# Get all Instagram profiles
curl http://localhost:3000/api/profiles/instagram
```

---

## 🐛 Troubleshooting

### Extension Issues

**Problem**: Extension doesn't detect platform  
**Solution**: Ensure you're on a profile page, not feed/posts

**Problem**: "Send to Backend" button disabled  
**Solution**: Navigate to a supported profile URL

**Problem**: Extension not appearing  
**Solution**: Check `chrome://extensions/` for errors

### Backend Issues

**Problem**: Connection refused  
**Solution**: 
```bash
cd backend
npm start
# Ensure server is running on port 3000
```

**Problem**: Database errors  
**Solution**:
```bash
rm database.sqlite  # Delete old database
npm start          # Restart to recreate
```

**Problem**: CORS errors  
**Solution**: Backend already configured for `*` origin

### Scraping Issues

**Problem**: Missing data fields  
**Solution**: LinkedIn/Instagram may have changed layout. Check browser console for selectors.

**Problem**: Counts showing as 0  
**Solution**: User might have hidden connection/follower counts

---

## 📊 API Endpoints

### POST `/api/scrape-profile`
Scrape a profile from HTML

**Request:**
```json
{
  "url": "https://www.linkedin.com/in/username",
  "html": "<!doctype html>..."
}
```

**Response:**
```json
{
  "success": true,
  "platform": "linkedin",
  "message": "Profile scraped successfully",
  "data": { /* profile data */ }
}
```

### GET `/api/profiles/:platform`
Get all profiles for a platform

**Response:**
```json
{
  "success": true,
  "platform": "linkedin",
  "count": 5,
  "data": [ /* array of profiles */ ]
}
```

### GET `/api/supported-platforms`
Get list of supported platforms

**Response:**
```json
{
  "success": true,
  "platforms": ["linkedin", "instagram"],
  "count": 2
}
```

---

## 🎓 Learning Outcomes

This project demonstrates:

1. **Separation of Concerns**: Extension captures, backend parses
2. **Platform Abstraction**: Factory pattern for multiple scrapers
3. **Robust Parsing**: Multiple fallback strategies
4. **RESTful Design**: Clean API architecture
5. **Error Handling**: Graceful failures at every layer
6. **Manifest V3**: Modern Chrome extension development

---

## 🚫 Limitations

- ❌ No automated login (users must log in manually)
- ❌ No rate limiting (implement if needed)
- ❌ No captcha handling
- ❌ No JavaScript rendering (uses static HTML)
- ❌ Limited to profile pages only

---

## 🔮 Future Enhancements

- [ ] Add Twitter/X support
- [ ] Add Facebook support
- [ ] Implement rate limiting
- [ ] Add export to CSV
- [ ] Add scheduling/automation
- [ ] Build admin dashboard
- [ ] Add authentication

---

## 📄 License

MIT License - Feel free to use for learning purposes

---

## 🤝 Contributing

This is an educational project. Improvements welcome!

---

## ⚠️ Disclaimer

This tool is for educational purposes only. Always respect:
- Website Terms of Service
- Robots.txt
- Rate limits
- User privacy
- Data protection laws (GDPR, etc.)

---

## 📧 Support

For issues or questions, please review the troubleshooting section first.

---

**Built with ❤️ for learning clean architecture and web scraping principles**