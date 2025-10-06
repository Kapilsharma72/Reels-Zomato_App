// Spotify Music API Service
class SpotifyMusicService {
  constructor() {
    this.clientId = 'YOUR_SPOTIFY_CLIENT_ID'; // Replace with your Spotify Client ID
    this.clientSecret = 'YOUR_SPOTIFY_CLIENT_SECRET'; // Replace with your Spotify Client Secret
    this.accessToken = null;
    this.baseURL = 'https://api.spotify.com/v1';
  }

  // Get access token from Spotify
  async getAccessToken() {
    if (this.accessToken) {
      return this.accessToken;
    }

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(this.clientId + ':' + this.clientSecret)
        },
        body: 'grant_type=client_credentials'
      });

      const data = await response.json();
      this.accessToken = data.access_token;
      return this.accessToken;
    } catch (error) {
      console.error('Error getting Spotify access token:', error);
      throw error;
    }
  }

  // Search for tracks
  async searchTracks(query, limit = 20) {
    try {
      const token = await this.getAccessToken();
      const response = await fetch(
        `${this.baseURL}/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();
      return data.tracks.items.map(track => this.formatTrack(track));
    } catch (error) {
      console.error('Error searching tracks:', error);
      throw error;
    }
  }

  // Get featured playlists
  async getFeaturedPlaylists(limit = 20) {
    try {
      const token = await this.getAccessToken();
      const response = await fetch(
        `${this.baseURL}/browse/featured-playlists?limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();
      return data.playlists.items;
    } catch (error) {
      console.error('Error getting featured playlists:', error);
      throw error;
    }
  }

  // Get tracks from a playlist
  async getPlaylistTracks(playlistId, limit = 50) {
    try {
      const token = await this.getAccessToken();
      const response = await fetch(
        `${this.baseURL}/playlists/${playlistId}/tracks?limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();
      return data.items.map(item => this.formatTrack(item.track));
    } catch (error) {
      console.error('Error getting playlist tracks:', error);
      throw error;
    }
  }

  // Format track data for our app
  formatTrack(track) {
    return {
      id: track.id,
      name: track.name,
      artist: track.artists[0].name,
      duration: this.formatDuration(track.duration_ms),
      genre: 'Various', // Spotify doesn't provide genre for individual tracks
      mood: this.determineMood(track.name, track.artists[0].name),
      category: 'spotify',
      audioUrl: track.preview_url, // 30-second preview
      thumbnail: track.album.images[0]?.url || '/default-music-thumbnail.jpg',
      description: `From ${track.album.name}`,
      spotifyUrl: track.external_urls.spotify,
      popularity: track.popularity
    };
  }

  // Format duration from milliseconds to MM:SS
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  // Determine mood based on track name and artist
  determineMood(trackName, artistName) {
    const energeticKeywords = ['beat', 'dance', 'party', 'energy', 'fire', 'hot'];
    const chillKeywords = ['chill', 'calm', 'peaceful', 'soft', 'gentle'];
    const romanticKeywords = ['love', 'romance', 'heart', 'sweet', 'tender'];
    
    const text = (trackName + ' ' + artistName).toLowerCase();
    
    if (energeticKeywords.some(keyword => text.includes(keyword))) {
      return 'Energetic';
    } else if (chillKeywords.some(keyword => text.includes(keyword))) {
      return 'Chill';
    } else if (romanticKeywords.some(keyword => text.includes(keyword))) {
      return 'Romantic';
    } else {
      return 'Upbeat';
    }
  }

  // Get food-themed playlists
  async getFoodThemedPlaylists() {
    const foodQueries = [
      'cooking music',
      'kitchen beats',
      'food truck music',
      'restaurant music',
      'chef music',
      'dining music'
    ];

    const allTracks = [];
    
    for (const query of foodQueries) {
      try {
        const tracks = await this.searchTracks(query, 10);
        allTracks.push(...tracks);
      } catch (error) {
        console.error(`Error searching for ${query}:`, error);
      }
    }

    // Remove duplicates and return unique tracks
    const uniqueTracks = allTracks.filter((track, index, self) => 
      index === self.findIndex(t => t.id === track.id)
    );

    return uniqueTracks.slice(0, 50); // Return top 50 unique tracks
  }

  // Get trending music
  async getTrendingMusic() {
    try {
      const tracks = await this.searchTracks('trending music 2024', 20);
      return tracks;
    } catch (error) {
      console.error('Error getting trending music:', error);
      return [];
    }
  }

  // Get cooking music
  async getCookingMusic() {
    try {
      const tracks = await this.searchTracks('cooking music kitchen beats', 20);
      return tracks;
    } catch (error) {
      console.error('Error getting cooking music:', error);
      return [];
    }
  }

  // Get stories music (shorter, upbeat tracks)
  async getStoriesMusic() {
    try {
      const tracks = await this.searchTracks('short upbeat music', 20);
      return tracks;
    } catch (error) {
      console.error('Error getting stories music:', error);
      return [];
    }
  }

  // Get mood-based music
  async getMoodMusic(mood = 'upbeat') {
    try {
      const tracks = await this.searchTracks(`${mood} music`, 20);
      return tracks;
    } catch (error) {
      console.error('Error getting mood music:', error);
      return [];
    }
  }
}

// Create and export a singleton instance
const spotifyMusicService = new SpotifyMusicService();
export default spotifyMusicService;
