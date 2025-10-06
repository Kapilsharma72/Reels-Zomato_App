// Music Service for Food Content
class MusicService {
  constructor() {
    this.musicLibrary = {
      trending: [
        {
          id: 'trending_1',
          name: 'Spice Up Your Life',
          artist: 'Flavor Master',
          duration: '0:30',
          genre: 'Hip Hop',
          mood: 'Energetic',
          category: 'trending',
          audioUrl: '/music/trending/spice-up-your-life.mp3',
          thumbnail: '/music/thumbnails/spice-up.jpg',
          description: 'Perfect for spicy food content'
        },
        {
          id: 'trending_2',
          name: 'Kitchen Vibes',
          artist: 'Chef Beats',
          duration: '0:45',
          genre: 'Electronic',
          mood: 'Upbeat',
          category: 'trending',
          audioUrl: '/music/trending/kitchen-vibes.mp3',
          thumbnail: '/music/thumbnails/kitchen-vibes.jpg',
          description: 'Great for cooking videos'
        },
        {
          id: 'trending_3',
          name: 'Food Truck Anthem',
          artist: 'Street Chef',
          duration: '0:50',
          genre: 'Rock',
          mood: 'Bold',
          category: 'trending',
          audioUrl: '/music/trending/food-truck-anthem.mp3',
          thumbnail: '/music/thumbnails/food-truck.jpg',
          description: 'Perfect for street food content'
        },
        {
          id: 'trending_4',
          name: 'Dinner Time',
          artist: 'Meal Maker',
          duration: '0:25',
          genre: 'Jazz',
          mood: 'Smooth',
          category: 'trending',
          audioUrl: '/music/trending/dinner-time.mp3',
          thumbnail: '/music/thumbnails/dinner-time.jpg',
          description: 'Ideal for fine dining content'
        }
      ],
      cooking: [
        {
          id: 'cooking_1',
          name: 'Sizzle & Pop',
          artist: 'Pan Master',
          duration: '0:35',
          genre: 'Funk',
          mood: 'Fun',
          category: 'cooking',
          audioUrl: '/music/cooking/sizzle-pop.mp3',
          thumbnail: '/music/thumbnails/sizzle-pop.jpg',
          description: 'Perfect for frying and cooking sounds'
        },
        {
          id: 'cooking_2',
          name: 'Chopping Beat',
          artist: 'Knife Skills',
          duration: '0:40',
          genre: 'Hip Hop',
          mood: 'Rhythmic',
          category: 'cooking',
          audioUrl: '/music/cooking/chopping-beat.mp3',
          thumbnail: '/music/thumbnails/chopping-beat.jpg',
          description: 'Great for prep work and chopping'
        },
        {
          id: 'cooking_3',
          name: 'Baking Dreams',
          artist: 'Oven Master',
          duration: '0:30',
          genre: 'Pop',
          mood: 'Sweet',
          category: 'cooking',
          audioUrl: '/music/cooking/baking-dreams.mp3',
          thumbnail: '/music/thumbnails/baking-dreams.jpg',
          description: 'Perfect for baking and desserts'
        },
        {
          id: 'cooking_4',
          name: 'Grill Master',
          artist: 'BBQ King',
          duration: '0:45',
          genre: 'Country',
          mood: 'Rustic',
          category: 'cooking',
          audioUrl: '/music/cooking/grill-master.mp3',
          thumbnail: '/music/thumbnails/grill-master.jpg',
          description: 'Ideal for grilling and BBQ content'
        }
      ],
      stories: [
        {
          id: 'story_1',
          name: 'Quick Bite',
          artist: 'Snack DJ',
          duration: '0:15',
          genre: 'Hip Hop',
          mood: 'Fast',
          category: 'stories',
          audioUrl: '/music/stories/quick-bite.mp3',
          thumbnail: '/music/thumbnails/quick-bite.jpg',
          description: 'Perfect for quick food stories'
        },
        {
          id: 'story_2',
          name: 'Fast Food',
          artist: 'Speed Chef',
          duration: '0:20',
          genre: 'Electronic',
          mood: 'Energetic',
          category: 'stories',
          audioUrl: '/music/stories/fast-food.mp3',
          thumbnail: '/music/thumbnails/fast-food.jpg',
          description: 'Great for fast food content'
        },
        {
          id: 'story_3',
          name: 'Instant Spice',
          artist: 'Quick Cook',
          duration: '0:18',
          genre: 'Pop',
          mood: 'Spicy',
          category: 'stories',
          audioUrl: '/music/stories/instant-spice.mp3',
          thumbnail: '/music/thumbnails/instant-spice.jpg',
          description: 'Perfect for spicy food stories'
        },
        {
          id: 'story_4',
          name: 'Rapid Recipe',
          artist: 'Fast Foodie',
          duration: '0:25',
          genre: 'R&B',
          mood: 'Smooth',
          category: 'stories',
          audioUrl: '/music/stories/rapid-recipe.mp3',
          thumbnail: '/music/thumbnails/rapid-recipe.jpg',
          description: 'Ideal for quick recipe stories'
        }
      ],
      mood: [
        {
          id: 'mood_1',
          name: 'Cozy Kitchen',
          artist: 'Home Chef',
          duration: '0:35',
          genre: 'Acoustic',
          mood: 'Cozy',
          category: 'mood',
          audioUrl: '/music/mood/cozy-kitchen.mp3',
          thumbnail: '/music/thumbnails/cozy-kitchen.jpg',
          description: 'Perfect for home cooking vibes'
        },
        {
          id: 'mood_2',
          name: 'Midnight Snack',
          artist: 'Night Owl',
          duration: '0:30',
          genre: 'Ambient',
          mood: 'Chill',
          category: 'mood',
          audioUrl: '/music/mood/midnight-snack.mp3',
          thumbnail: '/music/thumbnails/midnight-snack.jpg',
          description: 'Great for late night food content'
        },
        {
          id: 'mood_3',
          name: 'Morning Brew',
          artist: 'Coffee Lover',
          duration: '0:25',
          genre: 'Indie',
          mood: 'Fresh',
          category: 'mood',
          audioUrl: '/music/mood/morning-brew.mp3',
          thumbnail: '/music/thumbnails/morning-brew.jpg',
          description: 'Perfect for breakfast content'
        },
        {
          id: 'mood_4',
          name: 'Sunset Dinner',
          artist: 'Golden Hour',
          duration: '0:40',
          genre: 'Jazz',
          mood: 'Romantic',
          category: 'mood',
          audioUrl: '/music/mood/sunset-dinner.mp3',
          thumbnail: '/music/thumbnails/sunset-dinner.jpg',
          description: 'Ideal for romantic dinner content'
        }
      ]
    };
  }

  // Get all music tracks
  getAllMusic() {
    return Object.values(this.musicLibrary).flat();
  }

  // Get music by category
  getMusicByCategory(category) {
    return this.musicLibrary[category] || [];
  }

  // Get trending music
  getTrendingMusic() {
    return this.musicLibrary.trending;
  }

  // Get cooking music
  getCookingMusic() {
    return this.musicLibrary.cooking;
  }

  // Get stories music (shorter tracks)
  getStoriesMusic() {
    return this.musicLibrary.stories;
  }

  // Get mood-based music
  getMoodMusic() {
    return this.musicLibrary.mood;
  }

  // Search music by name, artist, or genre
  searchMusic(query) {
    const allMusic = this.getAllMusic();
    const lowercaseQuery = query.toLowerCase();
    
    return allMusic.filter(music => 
      music.name.toLowerCase().includes(lowercaseQuery) ||
      music.artist.toLowerCase().includes(lowercaseQuery) ||
      music.genre.toLowerCase().includes(lowercaseQuery) ||
      music.mood.toLowerCase().includes(lowercaseQuery)
    );
  }

  // Get music by mood
  getMusicByMood(mood) {
    const allMusic = this.getAllMusic();
    return allMusic.filter(music => music.mood.toLowerCase() === mood.toLowerCase());
  }

  // Get music by genre
  getMusicByGenre(genre) {
    const allMusic = this.getAllMusic();
    return allMusic.filter(music => music.genre.toLowerCase() === genre.toLowerCase());
  }

  // Get music track by ID
  getMusicById(id) {
    const allMusic = this.getAllMusic();
    return allMusic.find(music => music.id === id);
  }

  // Get recommended music based on content type
  getRecommendedMusic(contentType = 'reels') {
    if (contentType === 'stories') {
      return this.getStoriesMusic();
    } else if (contentType === 'cooking') {
      return this.getCookingMusic();
    } else {
      return this.getTrendingMusic();
    }
  }

  // Get music categories
  getCategories() {
    return [
      { id: 'trending', name: 'Trending', icon: '🔥' },
      { id: 'cooking', name: 'Cooking', icon: '👨‍🍳' },
      { id: 'stories', name: 'Stories', icon: '📱' },
      { id: 'mood', name: 'Mood', icon: '🎭' }
    ];
  }

  // Get music genres
  getGenres() {
    const allMusic = this.getAllMusic();
    const genres = [...new Set(allMusic.map(music => music.genre))];
    return genres.sort();
  }

  // Get music moods
  getMoods() {
    const allMusic = this.getAllMusic();
    const moods = [...new Set(allMusic.map(music => music.mood))];
    return moods.sort();
  }
}

// Create and export a singleton instance
const musicService = new MusicService();
export default musicService;
