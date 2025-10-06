import { API_ENDPOINTS } from '../config/api';

// Helper function to check if user is authenticated
const isAuthenticated = () => {
  const cookies = document.cookie.split(';');
  const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='));
  return !!tokenCookie;
};

// Helper function to create FormData with auth headers
const createFormData = (data, fileField = null, file = null) => {
  const formData = new FormData();
  
  // Add text fields
  Object.keys(data).forEach(key => {
    if (data[key] !== null && data[key] !== undefined) {
      if (typeof data[key] === 'object') {
        formData.append(key, JSON.stringify(data[key]));
      } else {
        formData.append(key, data[key]);
      }
    }
  });
  
  // Add file if provided
  if (file && fileField) {
    formData.append(fileField, file);
  }
  
  return formData;
};

// Reels API
export const reelsAPI = {
  // Create a new reel
  createReel: async (reelData, videoFile) => {
    try {
      const formData = createFormData(reelData, 'video', videoFile);
      
      const response = await fetch(API_ENDPOINTS.FOOD, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload reel');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating reel:', error);
      throw error;
    }
  },

  // Get all reels
  getReels: async () => {
    try {
      const response = await fetch(API_ENDPOINTS.FOOD, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reels');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching reels:', error);
      throw error;
    }
  },

  // Get reels by food partner
  getMyReels: async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.FOOD}/my-reels`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch your reels');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching your reels:', error);
      throw error;
    }
  }
};

// Posts API
export const postsAPI = {
  // Create a new post
  createPost: async (postData, imageFiles) => {
    try {
      const formData = new FormData();
      
      // Add text fields
      formData.append('description', postData.description);
      
      // Add image files
      if (imageFiles && imageFiles.length > 0) {
        imageFiles.forEach((file, index) => {
          formData.append('images', file);
        });
      }
      
      const response = await fetch(API_ENDPOINTS.POSTS, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload post');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  },

  // Get all posts
  getPosts: async () => {
    try {
      const response = await fetch(API_ENDPOINTS.POSTS, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  },

  // Get posts by food partner
  getMyPosts: async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.POSTS}/my-posts`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch your posts');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching your posts:', error);
      throw error;
    }
  }
};

// Stories API
export const storiesAPI = {
  // Create a new story
  createStory: async (storyData, videoFile) => {
    try {
      const formData = createFormData(storyData, 'video', videoFile);
      
      const response = await fetch(API_ENDPOINTS.STORIES, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload story');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating story:', error);
      throw error;
    }
  },

  // Get all stories
  getStories: async () => {
    try {
      const response = await fetch(API_ENDPOINTS.STORIES, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stories');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching stories:', error);
      throw error;
    }
  },

  // Get stories by food partner
  getMyStories: async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.STORIES}/my-stories`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch your stories');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching your stories:', error);
      throw error;
    }
  },

  // Mark story as viewed
  markStoryAsViewed: async (storyId) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.STORIES}/${storyId}/view`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to mark story as viewed');
      }

      return await response.json();
    } catch (error) {
      console.error('Error marking story as viewed:', error);
      throw error;
    }
  }
};
