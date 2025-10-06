# 🎵 Music API Integration Setup Guide

## 🚀 **Quick Setup Options:**

### **Option 1: Spotify API (Recommended)**

#### **Step 1: Create Spotify App**
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click "Create App"
3. Fill in app details:
   - **App Name**: "Reel-Zomato Music"
   - **App Description**: "Music integration for food content app"
   - **Website**: Your website URL
   - **Redirect URI**: `http://localhost:3000/callback` (for development)

#### **Step 2: Get Credentials**
1. Copy your **Client ID** and **Client Secret**
2. Update `Frontend/src/services/spotifyMusicService.js`:
   ```javascript
   this.clientId = 'YOUR_ACTUAL_CLIENT_ID';
   this.clientSecret = 'YOUR_ACTUAL_CLIENT_SECRET';
   ```

#### **Step 3: Enable Spotify in Your App**
1. Update your music service import in components:
   ```javascript
   // In ReelsUpload.jsx and StoriesUpload.jsx
   import musicService from '../services/hybridMusicService';
   ```

2. Enable Spotify integration:
   ```javascript
   // In your component
   useEffect(() => {
     musicService.initialize();
     musicService.setSpotifyEnabled(true);
   }, []);
   ```

### **Option 2: YouTube Music API**

#### **Step 1: Create YouTube API Project**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable YouTube Data API v3
4. Create credentials (API Key)

#### **Step 2: Implement YouTube Music Service**
```javascript
// Create Frontend/src/services/youtubeMusicService.js
class YouTubeMusicService {
  constructor() {
    this.apiKey = 'YOUR_YOUTUBE_API_KEY';
    this.baseURL = 'https://www.googleapis.com/youtube/v3';
  }

  async searchMusic(query) {
    const response = await fetch(
      `${this.baseURL}/search?part=snippet&q=${query}&type=video&videoCategoryId=10&key=${this.apiKey}`
    );
    const data = await response.json();
    return data.items.map(item => ({
      id: item.id.videoId,
      name: item.snippet.title,
      artist: item.snippet.channelTitle,
      audioUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      thumbnail: item.snippet.thumbnails.medium.url
    }));
  }
}
```

### **Option 3: SoundCloud API**

#### **Step 1: Create SoundCloud App**
1. Go to [SoundCloud Developer](https://developers.soundcloud.com/)
2. Create a new app
3. Get your Client ID

#### **Step 2: Implement SoundCloud Service**
```javascript
// Create Frontend/src/services/soundcloudMusicService.js
class SoundCloudMusicService {
  constructor() {
    this.clientId = 'YOUR_SOUNDCLOUD_CLIENT_ID';
    this.baseURL = 'https://api.soundcloud.com';
  }

  async searchMusic(query) {
    const response = await fetch(
      `${this.baseURL}/tracks?q=${query}&client_id=${this.clientId}`
    );
    const data = await response.json();
    return data.map(track => ({
      id: track.id,
      name: track.title,
      artist: track.user.username,
      audioUrl: track.stream_url + `?client_id=${this.clientId}`,
      thumbnail: track.artwork_url
    }));
  }
}
```

## 🔧 **Implementation Steps:**

### **Step 1: Choose Your API**
- **Spotify**: Best for popular music, requires setup
- **YouTube**: Free, large library, easy setup
- **SoundCloud**: Great for indie music, free tier

### **Step 2: Update Music Service**
Replace the import in your components:
```javascript
// Old
import musicService from '../services/musicService';

// New
import musicService from '../services/hybridMusicService';
```

### **Step 3: Add API Configuration**
Create a config file:
```javascript
// Frontend/src/config/musicConfig.js
export const MUSIC_CONFIG = {
  spotify: {
    clientId: 'YOUR_SPOTIFY_CLIENT_ID',
    clientSecret: 'YOUR_SPOTIFY_CLIENT_SECRET',
    enabled: true
  },
  youtube: {
    apiKey: 'YOUR_YOUTUBE_API_KEY',
    enabled: false
  },
  soundcloud: {
    clientId: 'YOUR_SOUNDCLOUD_CLIENT_ID',
    enabled: false
  }
};
```

### **Step 4: Test the Integration**
1. Start your app
2. Go to ReelsUpload or StoriesUpload
3. Click "Select Music"
4. You should see real music from your chosen API

## 🎯 **Recommended Approach:**

### **For Development:**
1. **Start with Spotify API** (most reliable)
2. **Use the hybrid service** (combines local + API)
3. **Test with a few tracks** first

### **For Production:**
1. **Multiple APIs** for redundancy
2. **Fallback to local music** if API fails
3. **Caching** for better performance

## 🚨 **Important Notes:**

### **API Limits:**
- **Spotify**: 10,000 requests per day (free tier)
- **YouTube**: 10,000 requests per day (free tier)
- **SoundCloud**: 15,000 requests per day (free tier)

### **Legal Considerations:**
- **Spotify**: Preview tracks only (30 seconds)
- **YouTube**: Check terms of service
- **SoundCloud**: Respect creator rights

### **Performance:**
- **Cache results** to reduce API calls
- **Use local fallback** if API is down
- **Implement rate limiting**

## 🔄 **Quick Test:**

After setup, test with this code:
```javascript
// Test in browser console
import musicService from './services/hybridMusicService';
musicService.initialize().then(() => {
  musicService.setSpotifyEnabled(true);
  musicService.getAllMusic().then(music => {
    console.log('Found music:', music.length);
  });
});
```

## 📞 **Need Help?**

If you need help with any specific API setup, let me know which one you'd like to implement and I'll guide you through the process step by step!
