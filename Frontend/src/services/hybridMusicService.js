// Hybrid Music Service - Combines Local Music with Spotify API
import spotifyMusicService from './spotifyMusicService.js';

class HybridMusicService {
  constructor() {
    this.useSpotify = false; // Toggle to enable/disable Spotify
    this.localMusicService = null; // Will be imported from musicService.js
  }

  // Initialize the service
  async initialize() {
    try {
      // Try to import local music service
      const { default: localMusicService } = await import('./musicService.js');
      this.localMusicService = localMusicService;
    } catch (error) {
      console.error('Error loading local music service:', error);
    }
  }

  // Get all music (combines local + Spotify)
  async getAllMusic() {
    const localMusic = this.localMusicService ? this.localMusicService.getAllMusic() : [];
    
    if (this.useSpotify) {
      try {
        const spotifyMusic = await spotifyMusicService.getFoodThemedPlaylists();
        return [...localMusic, ...spotifyMusic];
      } catch (error) {
        console.error('Error getting Spotify music:', error);
        return localMusic;
      }
    }
    
    return localMusic;
  }

  // Get music by category
  async getMusicByCategory(category) {
    const localMusic = this.localMusicService ? this.localMusicService.getMusicByCategory(category) : [];
    
    if (this.useSpotify) {
      try {
        let spotifyMusic = [];
        switch (category) {
          case 'trending':
            spotifyMusic = await spotifyMusicService.getTrendingMusic();
            break;
          case 'cooking':
            spotifyMusic = await spotifyMusicService.getCookingMusic();
            break;
          case 'stories':
            spotifyMusic = await spotifyMusicService.getStoriesMusic();
            break;
          case 'mood':
            spotifyMusic = await spotifyMusicService.getMoodMusic();
            break;
          default:
            spotifyMusic = await spotifyMusicService.getFoodThemedPlaylists();
        }
        return [...localMusic, ...spotifyMusic];
      } catch (error) {
        console.error('Error getting Spotify music by category:', error);
        return localMusic;
      }
    }
    
    return localMusic;
  }

  // Search music
  async searchMusic(query) {
    const localResults = this.localMusicService ? this.localMusicService.searchMusic(query) : [];
    
    if (this.useSpotify) {
      try {
        const spotifyResults = await spotifyMusicService.searchTracks(query, 20);
        return [...localResults, ...spotifyResults];
      } catch (error) {
        console.error('Error searching Spotify music:', error);
        return localResults;
      }
    }
    
    return localResults;
  }

  // Get recommended music
  async getRecommendedMusic(contentType = 'reels') {
    const localMusic = this.localMusicService ? this.localMusicService.getRecommendedMusic(contentType) : [];
    
    if (this.useSpotify) {
      try {
        let spotifyMusic = [];
        if (contentType === 'stories') {
          spotifyMusic = await spotifyMusicService.getStoriesMusic();
        } else if (contentType === 'cooking') {
          spotifyMusic = await spotifyMusicService.getCookingMusic();
        } else {
          spotifyMusic = await spotifyMusicService.getTrendingMusic();
        }
        return [...localMusic, ...spotifyMusic];
      } catch (error) {
        console.error('Error getting Spotify recommendations:', error);
        return localMusic;
      }
    }
    
    return localMusic;
  }

  // Get categories
  getCategories() {
    const localCategories = this.localMusicService ? this.localMusicService.getCategories() : [];
    
    if (this.useSpotify) {
      return [
        ...localCategories,
        { id: 'spotify', name: 'Spotify', icon: '🎵' }
      ];
    }
    
    return localCategories;
  }

  // Toggle Spotify integration
  setSpotifyEnabled(enabled) {
    this.useSpotify = enabled;
  }

  // Check if Spotify is available
  async checkSpotifyAvailability() {
    try {
      await spotifyMusicService.getAccessToken();
      return true;
    } catch (error) {
      console.error('Spotify not available:', error);
      return false;
    }
  }
}

// Create and export a singleton instance
const hybridMusicService = new HybridMusicService();
export default hybridMusicService;
